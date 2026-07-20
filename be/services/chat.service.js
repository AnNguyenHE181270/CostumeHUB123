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
1. Trả lời như một nhân viên tư vấn chuyên nghiệp, lịch sự, thân thiện nhưng phải CỰC KỲ ngắn gọn, súc tích, đi thẳng vào vấn đề. TUYỆT ĐỐI KHÔNG DÙNG FORMAT MARKDOWN (không dùng dấu ** hay * để in đậm/in nghiêng).
2. Khi khách hỏi về lịch trống của một sản phẩm từ ngày A đến ngày B, hãy trả lời ngắn gọn: "Có nhé bạn..." nếu còn trống, hoặc "Hiện tại thì không..." nếu đã hết hàng. TUYỆT ĐỐI KHÔNG giải thích chi tiết về số liệu tồn kho hay dữ liệu lịch khách khác đã thuê. KHÔNG KỂ LỂ SỐ LIỆU.
3. Nếu bạn giới thiệu hoặc nhắc đến một sản phẩm cụ thể, HÃY LUÔN chèn mã sau vào cuối câu trả lời của bạn: [PRODUCT:id_của_sản_phẩm] (ví dụ: [PRODUCT:60d...123]). Hệ thống sẽ dùng mã này để hiển thị thẻ sản phẩm cho khách.
4. NẾU KHÁCH YÊU CẦU THUÊ ĐỒ (hoặc thuê lại đồ cũ):
   - Nếu khách chưa cung cấp đủ 4 thông tin (tên sản phẩm, size, ngày nhận đồ, ngày trả đồ), hãy lịch sự hỏi thêm thông tin còn thiếu.
   - Nếu khách ĐÃ cung cấp đủ 4 thông tin trên (hoặc bạn đã suy ra được dựa trên câu hỏi của khách), HÃY CHÈN MÃ SAU VÀO CUỐI: [RENT_NOW:costumeId,size,YYYY-MM-DD,YYYY-MM-DD] (Ví dụ: [RENT_NOW:64abc...,M,2024-05-01,2024-05-03]). Mã costumeId lấy từ dữ liệu bên dưới.
   - Kèm theo câu nhắn ngắn gọn: "Mình đã chuẩn bị đơn thuê cho bạn, vui lòng kiểm tra thông tin và xác nhận bên dưới nhé!"

Dữ liệu hệ thống cung cấp (bao gồm ID sản phẩm, tổng số lượng trong kho và các lịch khách ĐÃ đặt thuê):
${catalogInfo}

Hướng dẫn kiểm tra lịch trống (CHỈ DÙNG ĐỂ TÍNH TOÁN TRONG ĐẦU, KHÔNG NÓI RA CHO KHÁCH):
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
    let rentNowData = null;

    // Parse RENT_NOW tag
    const rentRegex = /\[RENT_NOW:([a-zA-Z0-9_]+),([^,]+),([^,]+),([^\]]+)\]/g;
    const rentMatches = [...finalReply.matchAll(rentRegex)];
    if (rentMatches.length > 0) {
       rentNowData = {
          costumeId: rentMatches[0][1],
          size: rentMatches[0][2],
          startDate: rentMatches[0][3],
          endDate: rentMatches[0][4],
       };
       finalReply = finalReply.replace(rentRegex, '').trim();
       recommendedProductId = rentNowData.costumeId;
    }

    // Parse PRODUCT tag
    const productRegex = /\[PRODUCT:([a-zA-Z0-9_]+)\]/g;
    const matches = [...finalReply.matchAll(productRegex)];
    if (matches.length > 0) {
      if (!recommendedProductId) recommendedProductId = matches[0][1];
      finalReply = finalReply.replace(productRegex, '').trim();
    }
    
    let recommendedProduct = null;
    if (recommendedProductId) {
       recommendedProduct = await Costume.findById(recommendedProductId).select('name images price pricePerDay deposit _id').lean();
    }

    return { reply: finalReply, product: recommendedProduct, rentNowData };
  } catch (error) {
    console.error("Chat service error:", error);
    throw new HttpError(error.message || "AI Chat processing failed", 500);
  }
};

module.exports = {
  processChat,
};
