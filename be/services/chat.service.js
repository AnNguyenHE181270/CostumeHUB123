const { GoogleGenerativeAI } = require("@google/generative-ai");
const Costume = require("../models/costume.model");
const Rental = require("../models/rental.model");
const HttpError = require("../models/http-error.model");

const processChat = async (message, history) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpError("Chưa cấu hình GEMINI_API_KEY trong file .env", 500);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 1. Lấy thông tin trang phục
    const costumes = await Costume.find({}).select('name price pricePerDay variants.size variants.availableStock description').lean();
    
    // 2. Lấy thông tin các đơn thuê đang active để tính toán lịch trống
    const activeRentals = await Rental.find({
        status: { $in: ['pending', 'delivering', 'delivered', 'renting'] }
    }).select('items startDate endDate').lean();

    // Gom nhóm các lịch thuê theo costumeId và size
    const rentedDates = {};
    activeRentals.forEach(rental => {
        if (!rental.startDate || !rental.endDate) return;
        const start = rental.startDate.toISOString().split('T')[0];
        const end = rental.endDate.toISOString().split('T')[0];
        
        rental.items.forEach(item => {
            const costumeId = item.costume.toString();
            const key = `${costumeId}_${item.size}`;
            if (!rentedDates[key]) rentedDates[key] = [];
            rentedDates[key].push(`từ ${start} đến ${end} (SL: ${item.quantity})`);
        });
    });

    let catalogInfo = "Danh sách trang phục hiện có tại CostumeHUB:\n";
    costumes.forEach(c => {
      let variantsInfo = [];
      if (Array.isArray(c.variants)) {
         c.variants.forEach(v => {
            const key = `${c._id}_${v.size}`;
            const rentals = rentedDates[key];
            let rentStr = rentals && rentals.length > 0 ? ` [Đã có lịch khách thuê: ${rentals.join(', ')}]` : " [Hiện chưa có ai thuê]";
            variantsInfo.push(`Size ${v.size} (Tổng kho: ${v.availableStock})${rentStr}`);
         });
      }
      let variantsStr = variantsInfo.length > 0 ? variantsInfo.join("; ") : "Không có size";
      catalogInfo += `- Sản phẩm: "${c.name}" (ID: ${c._id}). Giá thuê: ${c.pricePerDay || c.price} VNĐ/ngày. Tình trạng: ${variantsStr}.\n`;
    });

    const systemPrompt = `Bạn là "Tư vấn viên AI" của cửa hàng cho thuê trang phục CostumeHUB. 
Nhiệm vụ của bạn là tư vấn khách hàng, kiểm tra lịch trống của trang phục, giới thiệu sản phẩm.
YÊU CẦU QUAN TRỌNG:
1. Khi khách hỏi về lịch trống của một sản phẩm từ ngày A đến ngày B, hãy trả lời CỰC KỲ ngắn gọn: "Có nhé bạn..." nếu còn trống, hoặc "Hiện tại thì không..." nếu đã hết hàng. TUYỆT ĐỐI KHÔNG giải thích chi tiết về số liệu tồn kho hay dữ liệu lịch khách khác đã thuê. Không kể lể số liệu.
2. Nếu bạn giới thiệu hoặc nhắc đến một sản phẩm cụ thể, HÃY LUÔN chèn mã sau vào cuối câu trả lời của bạn: [PRODUCT:id_của_sản_phẩm] (ví dụ: [PRODUCT:60d...123]). Hệ thống sẽ dùng mã này để hiển thị thẻ sản phẩm cho khách.

Dữ liệu hệ thống cung cấp (bao gồm ID sản phẩm, tổng số lượng trong kho và các lịch khách ĐÃ đặt thuê):
${catalogInfo}

Hướng dẫn kiểm tra lịch trống (CHỈ DÙNG ĐỂ TÍNH TOÁN, KHÔNG NÓI RA CHO KHÁCH):
Khi khách hỏi thuê từ ngày A đến ngày B, hãy đối chiếu với [Đã có lịch khách thuê: ...] của sản phẩm đó. 
Nếu tổng số lượng khách đã thuê trong khoảng ngày A-B bằng hoặc vượt quá "Tổng kho", hãy báo là hết hàng. 
Nếu vẫn còn dư so với "Tổng kho", hãy báo khách là CÒN TRỐNG.`;

    const chatModel = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemPrompt
    });

    let validHistory = [...history];
    if (validHistory.length > 0 && validHistory[0].role === 'model') {
      validHistory.shift();
    }

    const formattedHistory = validHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text || " " }],
    }));

    const chat = chatModel.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    let finalReply = text;
    let recommendedProductId = null;

    const productRegex = /\[PRODUCT:([a-zA-Z0-9_]+)\]/g;
    const matches = [...text.matchAll(productRegex)];
    if (matches.length > 0) {
      recommendedProductId = matches[0][1];
      finalReply = text.replace(productRegex, '').trim();
    }
    
    let recommendedProduct = null;
    if (recommendedProductId) {
       recommendedProduct = await Costume.findById(recommendedProductId).select('name images price pricePerDay _id').lean();
    }

    return { reply: finalReply, product: recommendedProduct };
  } catch (error) {
    console.error("Chat service error:", error);
    throw new HttpError(error.message || "AI Chat processing failed", 500);
  }
};

module.exports = {
  processChat,
};
