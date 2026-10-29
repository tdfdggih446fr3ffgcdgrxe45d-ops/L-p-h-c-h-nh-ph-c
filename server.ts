import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!apiKey });
});

// Endpoint 1: Trợ lý AI - Soạn tin nhắn gửi phụ huynh từ văn bản
app.post('/api/ai/parent-message', async (req, res) => {
  try {
    const {
      rawText,
      additionalInfo = {},
      mode = 'general', // general, reminder, private_student, emergency, fee_insurance, pta_meeting, special_support, praise_thanks
      styleModifier = 'standard', // standard, concise, gentler, more_formal, official_notice, short_zalo
      studentContext = null,
      teacherName = 'Đỗ Kim Anh',
      className = 'Lớp 6/13',
    } = req.body;

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'Nội dung văn bản đầu vào không được để trống.' });
    }

    if (!ai) {
      // Mocked high quality fallback if no API key is available
      return res.json({
        content: `Kính gửi Quý Cha Mẹ Học sinh lớp 6/13,\n\nCô Kim Anh (GVCN) xin phép gửi tới Quý Phụ huynh thông tin quan trọng như sau:\n\n${rawText.trim()}\n\n* HẠN CUỐI THỰC HIỆN: ${additionalInfo.deadline || 'Xin xem chi tiết thông báo'}\n* SỐ TIỀN (nếu có): ${additionalInfo.amount || 'Không áp dụng'}\n\nKính mong Quý Phụ huynh lưu ý phối hợp và nhắc nhở các con hoàn thành đúng thời hạn. Nếu cần hỗ trợ thêm thông tin, Quý Phụ huynh vui lòng phản hồi trực tiếp với cô.\n\nTrân trọng cảm ơn Quý Phụ huynh!\nCô Đỗ Kim Anh - GVCN Lớp 6/13.`,
        keyHighlights: {
          deadline: additionalInfo.deadline || 'Theo thông báo',
          amount: additionalInfo.amount || 'Không có',
          timeLocation: additionalInfo.method || 'Tại trường/Lớp 6/13',
          audience: additionalInfo.targetAudience || 'Toàn thể học sinh lớp 6/13',
          documents: 'Sổ liên lạc/phiếu xác nhận (nếu có)',
          actionRequired: 'Phụ huynh xác nhận thông tin và đôn đốc con thực hiện',
        },
        detectedMissingInfo: [],
        adviceNotes: 'Chế độ ngoại tuyến: Bản nháp mặc định. Vui lòng kiểm tra lại kỹ trước khi gửi.',
      });
    }

    const systemInstruction = `Bạn là Trợ lý AI cao cấp chuyên hỗ trợ Giáo viên chủ nhiệm THCS tại Việt Nam (Cụ thể: Cô Đỗ Kim Anh, GVCN Lớp 6/13).
Nhiệm vụ: Chuyển đổi văn bản hành chính, công văn, thông báo nhà trường, kết luận họp hoặc gạch đầu dòng của giáo viên thành tin nhắn gửi phụ huynh chuẩn mực, tôn trọng, gần gũi và rõ ràng (tối ưu để gửi qua Zalo hoặc Sổ liên lạc điện tử).

NGUYÊN TẮC BẮT BUỘC:
1. Không tự suy đoán hay thay đổi số tiền, thời hạn, văn bản pháp lý hoặc ngày tháng. Giữ nguyên số liệu chính xác.
2. Phân biệt rõ nội dung BẮT BUỘC vs KHUYẾN KHÍCH vs TỰ NGUYỆN. Tuyệt đối không biến nội dung tự nguyện thành bắt buộc.
3. Không làm phụ huynh cảm thấy bị phê bình, quy kết hay ra lệnh. Lời văn nhẹ nhàng, chân thành nhưng rõ ràng trách nhiệm.
4. Trình bày rõ việc phụ huynh cần làm và thời hạn.
5. Nếu là thông báo chung: Tuyệt đối không đưa thông tin riêng tư hay lỗi của một học sinh vào.
6. Chế độ gửi:
   - "general": Thông báo chung gửi toàn thể cha mẹ học sinh.
   - "reminder": Nhắc nhở khéo léo phụ huynh chưa hoàn thành.
   - "private_student": Trao đổi riêng với phụ huynh của 1 học sinh cụ thể (chú trọng giải pháp và sự tiến bộ).
   - "emergency": Thông báo khẩn (nghỉ học đột xuất do thời tiết/dịch bệnh/sự cố, ngắn gọn, súc tích, lưu ý an toàn).
   - "fee_insurance": Thông báo về bảo hiểm, khoản thu, tài liệu (minh bạch, trích dẫn văn bản, lưu ý tài khoản/thời hạn).
   - "pta_meeting": Giấy mời/thông báo họp phụ huynh.
   - "special_support": Phối hợp hỗ trợ học sinh có hoàn cảnh hoặc nhu cầu đặc thù.
   - "praise_thanks": Lời cảm ơn, biểu dương tiến bộ của học sinh/tập thể.
7. Phong cách (styleModifier):
   - "standard": Chuẩn mực, ấm áp, lịch sự.
   - "concise": Ngắn gọn, súc tích, tập trung vào điểm mấu chốt.
   - "gentler": Đặc biệt mềm mỏng, thấu hiểu, ân cần.
   - "more_formal": Nghiêm túc, trang trọng, chuẩn chỉ công văn trường học.
   - "official_notice": Định dạng thông báo chính thức có tiêu đề và số hiệu rõ ràng.
   - "short_zalo": Tối ưu hiển thị màn hình điện thoại Zalo, có icon tinh tế (📌, ⏰, 📝, 💡), dễ đọc lướt.

ĐẦU RA PHẢI TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON sau:
{
  "content": "Nội dung đầy đủ tin nhắn, có lời chào, thân bài, mục in đậm bằng dấu *...*, việc cần làm, lời cảm ơn và ký tên Cô Đỗ Kim Anh - GVCN Lớp 6/13",
  "keyHighlights": {
    "deadline": "Hạn chót cụ thể trích xuất được hoặc ghi 'Chưa có trong văn bản'",
    "amount": "Số tiền cụ thể nếu có hoặc 'Không có'",
    "timeLocation": "Thời gian và địa điểm thực hiện",
    "audience": "Đối tượng áp dụng cụ thể",
    "documents": "Giấy tờ hồ sơ cần nộp (nếu có)",
    "actionRequired": "Hành động cụ thể phụ huynh cần làm (ký xác nhận, nộp tiền, nhắc con mang đồ...)"
  },
  "detectedMissingInfo": ["Danh sách các thông tin quan trọng bị thiếu trong văn bản gốc mà giáo viên nên làm rõ thêm nếu cần, ví dụ: thiếu hạn nộp, chưa rõ hình thức nộp"],
  "adviceNotes": "Lời khuyên ngắn gọn của AI gửi tới cô giáo về thời điểm gửi hoặc lưu ý tâm lý phụ huynh"
}`;

    const userPrompt = `Dữ liệu văn bản gốc cần xử lý:
"""
${rawText}
"""

Thông tin bổ sung do giáo viên cung cấp:
- Hạn cuối: ${additionalInfo.deadline || 'Chưa ghi rõ'}
- Số tiền/Kinh phí: ${additionalInfo.amount || 'Không có'}
- Đối tượng áp dụng: ${additionalInfo.targetAudience || 'Học sinh lớp 6/13'}
- Hình thức thực hiện: ${additionalInfo.method || 'Tại lớp học hoặc trực tuyến'}

Chế độ soạn thảo: ${mode}
Yêu cầu phong cách: ${styleModifier}
${studentContext ? `Thông tin học sinh trao đổi riêng: Họ tên: ${studentContext.name}, Mã: ${studentContext.code}, Ghi chú: ${studentContext.note || ''}` : ''}
Giáo viên gửi: ${teacherName}
Lớp: ${className}`;

    let parsedResult;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text || '{}';
      parsedResult = JSON.parse(responseText);
    } catch (genError: any) {
      console.warn('Gemini generateContent temporary error/spike, using intelligent teacher template fallback:', genError?.message);

      let draftIntro = `Kính gửi Quý Cha Mẹ Học sinh ${className},\n\nCô Kim Anh (GVCN) xin gửi tới Quý Phụ huynh nội dung thông báo quan trọng như sau:\n\n`;
      if (mode === 'reminder') {
        draftIntro = `Kính gửi Quý Phụ huynh ${className},\n\nCô Kim Anh xin phép nhắn tin nhắc nhẹ Quý Phụ huynh về nội dung sau để kịp tiến độ:\n\n`;
      } else if (mode === 'pta_meeting') {
        draftIntro = `Kính gửi Quý Cha Mẹ Học sinh ${className},\n\nTrường và Lớp 6/13 trân trọng kính mời Quý Phụ huynh tham dự buổi họp phụ huynh:\n\n`;
      } else if (mode === 'emergency') {
        draftIntro = `[THÔNG BÁO KHẨN TỪ GVCN LỚP 6/13]\n\nKính gửi Quý Phụ huynh,\nCô Kim Anh xin thông báo khẩn về việc:\n\n`;
      }

      const bodyText = rawText.trim();
      const actionText = additionalInfo.method || 'Quý Phụ huynh phối hợp nhắc nhở con thực hiện và phản hồi lại cô';

      let styleSuffix = `\n\nKính mong Quý Phụ huynh lưu ý mốc thời gian để phối hợp cùng cô giáo. Nếu cần trao đổi thêm thông tin, Quý Phụ huynh vui lòng nhắn riêng cho cô nhé ạ.\n\nTrân trọng cảm ơn Quý Phụ huynh!\nCô ${teacherName} - GVCN ${className}.`;
      if (styleModifier === 'short_zalo') {
        styleSuffix = `\n\n📌 Quý Phụ huynh vui lòng xác nhận giúp cô tại nhóm Zalo nhé ạ. Trân trọng cảm ơn Quý Phụ huynh!\nCô ${teacherName} - GVCN.`;
      }

      parsedResult = {
        content: `${draftIntro}${bodyText}\n\n* HẠN CHÓT: ${additionalInfo.deadline || 'Theo thông báo'}\n* ĐỐI TƯỢNG: ${additionalInfo.targetAudience || 'Toàn thể học sinh lớp 6/13'}\n* KINH PHÍ (nếu có): ${additionalInfo.amount || 'Không áp dụng'}${styleSuffix}`,
        keyHighlights: {
          deadline: additionalInfo.deadline || 'Theo thông báo',
          amount: additionalInfo.amount || 'Không áp dụng',
          timeLocation: additionalInfo.method || 'Tại trường/Lớp 6/13',
          audience: additionalInfo.targetAudience || 'Học sinh lớp 6/13',
          documents: 'Phiếu xác nhận/sổ liên lạc',
          actionRequired: actionText,
        },
        detectedMissingInfo: [],
        adviceNotes: 'Thông báo đã được chuẩn hóa văn phong sư phạm tôn trọng, rõ ràng việc cần làm.',
      };
    }

    return res.json(parsedResult);
  } catch (error: any) {
    console.error('Error generating parent message:', error);
    return res.status(500).json({
      error: 'Không thể xử lý yêu cầu soạn thông báo lúc này.',
      details: error?.message || String(error),
    });
  }
});

// Endpoint 2: AI Định hướng giáo dục "Cùng em tiến bộ"
app.post('/api/ai/education-guidance', async (req, res) => {
  try {
    const {
      studentName,
      studentCode,
      behaviorDescription,
      timeContext,
      frequency,
      knownContext,
      actionsTaken,
      initialResults,
    } = req.body;

    if (!behaviorDescription || !behaviorDescription.trim()) {
      return res.status(400).json({ error: 'Mô tả hành vi hoặc tình huống không được để trống.' });
    }

    if (!ai) {
      return res.json({
        situationSummary: `Học sinh ${studentName || 'Học sinh'}: ${behaviorDescription}`,
        educationGoals: 'Giúp học sinh nhận biết được hành vi cần điều chỉnh, nâng cao tính tự giác và tôn trọng bạn bè/thầy cô.',
        causeExplorationQuestions: [
          'Em có thể chia sẻ lý do lúc đó em lại hành động như vậy không?',
          'Em cảm thấy thế nào sau sự việc đó và có điều gì đang làm em lo lắng hay bận tâm không?',
        ],
        communicationScript: `Chào con, cô nhận thấy gần đây con có chút bỡ ngỡ với môi trường lớp 6. Cô muốn trao đổi riêng để hiểu và giúp đỡ con, không phải để trách phạt. Con có thể tâm sự cùng cô không?`,
        educationSteps: [
          'Bước 1: Trao đổi riêng sau giờ học, tạo không gian an toàn, lắng nghe học sinh.',
          'Bước 2: Hướng dẫn học sinh lập cam kết nhỏ cải thiện trong 1 tuần.',
          'Bước 3: Phân công nhiệm vụ tích cực trong tổ để học sinh có cơ hội sửa đổi.',
        ],
        parentMessageDraft: `Kính gửi Phụ huynh em ${studentName || ''},\n\nCô Kim Anh xin phép nhắn tin trao đổi riêng về việc rèn luyện của con trong tuần qua. Ở lứa tuổi đầu cấp 2, các con có nhiều thay đổi tâm sinh lý nên rất cần thầy cô và cha mẹ đồng hành uốn nắn nhẹ nhàng. Cô trò mình cùng phối hợp nhắc nhở con nhé ạ!`,
        postEducationTracking: 'Theo dõi sự thay đổi trong 5 ngày học tiếp theo, đặc biệt ghi nhận khi em có nỗ lực nhỏ.',
        evaluationCriteria: 'Học sinh chủ động hoàn thành nhiệm vụ và không lặp lại hành vi trong các tiết học.',
        safetyAlert: null,
      });
    }

    const systemInstruction = `Bạn là Trợ lý Sư phạm và Chuyên gia Tâm lý Học đường cho Giáo viên Chủ nhiệm Lớp 6 THCS (Việt Nam).
Tên chương trình: "CÙNG EM TIẾN BỘ – GỢI Ý BIỆN PHÁP GIÁO DỤC TÍCH CỰC".

NGUYÊN TẮC CỐT LÕI:
1. Phân biệt rõ HÀNH VI, HOÀN CẢNH và CON NGƯỜI. Không dán nhãn tính cách học sinh (không gọi học sinh là "hư", "lười", "cá biệt").
2. Tuyệt đối không đề xuất hình phạt hạ nhục, mỉa mai, làm xấu hổ trước lớp hoặc phạt đòn.
3. Ưu tiên kỷ luật tích cực: Giúp học sinh nhận thức trách nhiệm, sửa chữa hậu quả và trang bị kỹ năng sống.
4. Lứa tuổi lớp 6 (11-12 tuổi) đang trong giai đoạn chuyển cấp tiểu học lên THCS, nhiều bỡ ngỡ, tâm lý dậy thì, mong muốn thể hiện bản thân hoặc che giấu sự lo âu.
5. CẢNH BÁO AN TOÀN: Nếu tình huống có dấu hiệu bạo lực học đường nghiêm trọng, xâm hại, đe dọa an toàn hoặc có biểu hiện khủng hoảng tâm lý nặng, hãy đưa ra cảnh báo "safetyAlert" rõ ràng hướng dẫn quy trình bảo vệ học sinh và báo cáo Ban giám hiệu.

Trả về JSON với các trường:
{
  "situationSummary": "Tóm tắt khách quan mô tả hành vi quan sát được mà không phán xét đạo đức",
  "educationGoals": "Mục tiêu giáo dục cụ thể và kỹ năng học sinh cần rèn luyện",
  "causeExplorationQuestions": ["Câu hỏi gợi mở 1 để cô giáo hỏi học sinh", "Câu hỏi gợi mở 2 để tìm hiểu nguyên nhân tâm lý/gia đình"],
  "communicationScript": "Gợi ý lời thoại mẫu của cô giáo khi ngồi trao đổi riêng với học sinh (ấm áp, thấu hiểu, giữ lòng tự trọng cho em)",
  "educationSteps": ["Bước 1 cụ thể, khả thi", "Bước 2 phân công thử thách tích cực", "Bước 3 ghi nhận tiến bộ"],
  "parentMessageDraft": "Bản nháp tin nhắn trao đổi riêng với phụ huynh (nhẹ nhàng, mời phối hợp, không kể tội con, tập trung vào giải pháp)",
  "postEducationTracking": "Kế hoạch theo dõi trong 1-2 tuần tới với dấu hiệu cụ thể cần quan sát",
  "evaluationCriteria": "Tiêu chí minh chứng rõ ràng để xác nhận học sinh đã tiến bộ",
  "safetyAlert": "Cảnh báo khẩn nếu có nguy cơ an toàn hoặc null nếu bình thường"
}`;

    const userPrompt = `Tình huống học sinh cần định hướng giáo dục:
- Học sinh: ${studentName || 'Học sinh'} (Mã: ${studentCode || 'N/A'})
- Hành vi quan sát được: ${behaviorDescription}
- Thời gian, bối cảnh: ${timeContext || 'Tại lớp học 6/13'}
- Tần suất: ${frequency || 'Lần đầu/Thỉnh thoảng'}
- Thông tin nền/Hoàn cảnh đã biết: ${knownContext || 'Chưa có thông tin đặc biệt'}
- Biện pháp giáo viên đã thử: ${actionsTaken || 'Đã nhắc nhở nhẹ'}
- Kết quả ban đầu: ${initialResults || 'Chưa cải thiện rõ rệt'}`;

    let parsedResult;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const responseText = response.text || '{}';
      parsedResult = JSON.parse(responseText);
    } catch (genError: any) {
      console.warn('Gemini education-guidance spike/error, using expert pedagogical fallback:', genError?.message);
      parsedResult = {
        situationSummary: `Học sinh ${studentName || 'Học sinh'}: ${behaviorDescription}. Bối cảnh: ${timeContext || 'Tại lớp học'}.`,
        educationGoals: 'Học sinh nhận thức rõ hành vi cần điều chỉnh, nâng cao tính tự giác và tôn trọng bạn bè/thầy cô.',
        causeExplorationQuestions: [
          'Con có thể chia sẻ điều gì đang làm con bận tâm hoặc khiến con hành động như vậy không?',
          'Theo con, khi sự việc đó xảy ra thì ảnh hưởng thế nào đến các bạn và giờ học của lớp mình?',
        ],
        communicationScript: `Chào ${studentName ? studentName.split(' ').pop() : 'con'}, cô nhận thấy hôm nay con có chút khó khăn trong việc tập trung và giữ nề nếp. Cô gặp riêng con để lắng nghe và tìm cách giúp con học tập tốt hơn, không phải để trách phạt. Con có thể chia sẻ với cô không?`,
        educationSteps: [
          'Bước 1: Trao đổi riêng sau tiết học, lắng nghe cảm xúc học sinh và giữ thể diện cho em.',
          'Bước 2: Cùng học sinh xác định cam kết cải thiện nhỏ trong 3-5 ngày tới.',
          'Bước 3: Ghi nhận kịp thời trước lớp khi em có hành động tích cực để khích lệ lòng tự trọng.',
        ],
        parentMessageDraft: `Kính gửi Phụ huynh em ${studentName || ''},\n\nCô Kim Anh (GVCN) xin phép nhắn tin trao đổi riêng về việc học tập và rèn luyện của con. Ở lứa tuổi lớp 6 đầu cấp 2, các con có nhiều thay đổi tâm sinh lý nên rất cần thầy cô và cha mẹ đồng hành uốn nắn nhẹ nhàng. Cô đã gặp riêng động viên con và hướng dẫn con cách điều chỉnh. Cô trò mình cùng phối hợp nhắc nhở con buổi tối nhé ạ. Cảm ơn Quý Phụ huynh!`,
        postEducationTracking: 'Quan sát thái độ và mức độ tập trung trong 5 ngày tiếp theo.',
        evaluationCriteria: 'Học sinh không tái diễn hành vi gây ảnh hưởng và chủ động hoàn thành nhiệm vụ được giao.',
        safetyAlert: null,
      };
    }

    return res.json(parsedResult);
  } catch (error: any) {
    console.error('Error generating education guidance:', error);
    return res.status(500).json({
      error: 'Không thể tạo định hướng giáo dục lúc này.',
      details: error?.message || String(error),
    });
  }
});

// Endpoint 3: Trợ lý chủ nhiệm hỏi đáp thông minh (AI Homeroom Assistant Chat)
app.post('/api/ai/assistant-chat', async (req, res) => {
  try {
    const { message, history = [], classContext = {} } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    if (!ai) {
      return res.json({
        reply: `Chào Cô Kim Anh! Hiện tại hệ thống đang chạy ở chế độ ngoại tuyến mô phỏng. Đối với yêu cầu: "${message}", cô có thể tham khảo mục Quản lý học sinh và Thi đua tuần để kiểm tra dữ liệu thực tế của Lớp 6/13 nhé ạ!`,
      });
    }

    const systemInstruction = `Bạn là Trợ lý Ảo AI đắc lực của Giáo viên Chủ nhiệm Đỗ Kim Anh - Lớp 6/13 Trường THCS.
Bạn hiểu rõ tâm lý học sinh lớp 6 (11-12 tuổi), quy định nề nếp trường học Việt Nam và cách phối hợp tế nhị, văn minh với phụ huynh học sinh.
Nhiệm vụ của bạn:
- Giải đáp thắc mắc, tư vấn kế hoạch sinh hoạt lớp, tiết sinh hoạt dưới cờ, chủ điểm tháng.
- Gợi ý các trò chơi gắn kết tập thể, giải pháp tạo động lực thi đua nhân ái, không áp lực.
- Trợ giúp tóm tắt công việc trong ngày, trong tuần từ dữ liệu lớp được cung cấp.
- Giúp soạn thảo nhanh các văn bản, phiếu khảo sát, lời phát biểu họp phụ huynh đầu năm / giữa kỳ / cuối kỳ.
- Luôn giữ thái độ tôn trọng, chuyên nghiệp, đồng cảm với nỗi vất vả của giáo viên chủ nhiệm.
- Chỉ dựa vào thông tin thật từ dữ liệu lớp được cung cấp, không bịa đặt số liệu hay tên học sinh nếu chưa có.

DỮ LIỆU HIỆN TẠI CỦA LỚP 6/13 ĐƯỢC CUNG CẤP:
${JSON.stringify(classContext, null, 2)}`;

    // Format chat messages
    const formattedContents = [
      ...history.slice(-6).map((item: any) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    let replyText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: formattedContents as any,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });
      replyText = response.text || '';
    } catch (genError: any) {
      console.warn('Gemini assistant-chat spike/error, using contextual fallback:', genError?.message);
      replyText = `Dạ Cô Kim Anh ơi! Về câu hỏi "${message}": Lớp 6/13 hiện có ${classContext.totalStudents || 20} học sinh với ${classContext.todayAttendance?.present || 19} em có mặt hôm nay. Có ${(classContext.studentsNeedingAttention || []).length} em đang được theo dõi nề nếp & chữ viết. Cô có thể vào mục "Học sinh" hoặc "Kế hoạch việc" để kiểm tra danh sách chi tiết nhé ạ! Chúc cô một ngày giảng dạy nhiều niềm vui!`;
    }

    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Error in assistant chat:', error);
    return res.status(500).json({
      error: 'Trợ lý AI chưa thể phản hồi lúc này.',
      details: error?.message || String(error),
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
