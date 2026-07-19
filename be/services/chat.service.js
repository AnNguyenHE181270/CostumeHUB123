const { GoogleGenerativeAI } = require("@google/generative-ai");
const Costume = require("../models/costume.model");
const HttpError = require("../models/http-error.model");

const processChat = async (message, history) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpError("Chưa cấu hình GEMINI_API_KEY trong file .env", 500);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Lấy thông tin trang phục để làm ngữ cảnh
    const costumes = await Costume.find({}).select('name price pricePerDay variants.size variants.availableStock description').lean();
    
    let catalogInfo = "Danh sách trang phục hiện có tại CostumeHUB:\n";
    costumes.forEach(c => {
      let variantsStr = Array.isArray(c.variants) ? c.variants.map(v => `${v.size} (còn ${v.availableStock})`).join(", ") : "Không có size";
      catalogInfo += `- ${c.name}: Giá thuê ${c.pricePerDay || c.price} VNĐ/ngày. Size và tồn kho: ${variantsStr}.\n`;
    });

    const systemPrompt = `Bạn là trợ lý AI ảo của cửa hàng cho thuê trang phục CostumeHUB. 
Nhiệm vụ của bạn là tư vấn khách hàng, giới thiệu trang phục và hướng dẫn họ cách đặt đồ trên website.
Hãy trả lời lịch sự, ngắn gọn và thân thiện. Không được bịa ra sản phẩm không có trong danh sách.
${catalogInfo}

Nếu khách hàng muốn đặt đồ, hãy hướng dẫn họ chọn sản phẩm trên website, chọn ngày thuê, size và tiến hành thanh toán hoặc thêm vào giỏ hàng.`;

    const chatModel = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemPrompt
    });

    let validHistory = [...history];
    // Gemini yêu cầu lịch sử phải bắt đầu bằng 'user'. Nếu phần tử đầu là 'model', ta bỏ đi.
    if (validHistory.length > 0 && validHistory[0].role === 'model') {
      validHistory.shift();
    }

    const formattedHistory = validHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const chat = chatModel.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    return text;
  } catch (error) {
    console.error("Chat service error:", error);
    throw new HttpError(error.message || "AI Chat processing failed", 500);
  }
};

module.exports = {
  processChat,
};
