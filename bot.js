const axios = require('axios');
const cron = require('node-cron');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const http = require('http');

const TOPCV_URL = 'https://www.topcv.vn/tim-viec-lam-van-hanh-san-thuong-mai-dien-tu-tai-ha-noi-kl1?type_keyword=1&sba=1&locations=l1&saturday_status=0';
const GROUP_DICH_ID = '1389449883381299'; 
const FUNC_POST_ENDPOINT = 'https://public-api.func.vn/functions/6ad81998225b55a1275be6ec';
const DIRECT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZDgxOTk4MjI1YjU1YTEyNzViZTZlYyIsInR5cGUiOiJGVU5DVElPTiIsInBsYXRmb3JtIjoiRkFDRUJPT0tfVVNFUiIsImlhdCI6MTc5MjU0Nzc2OCwiZXhwIjoxODI0MDgzNzY4fQ.s3tD880fxMIWSflOMXtStSVziikS-4m7ZLZt7zPyTuQ';

// Tạo Web Server bind port cho Render
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot tuyen dung FB dang hoat dong tu dong 24/7!\n');
}).listen(PORT, HOST, () => {
    console.log(`🌐 Server lang nghe thanh cong tai http://${HOST}:${PORT}`);
});

// Danh sách dự phòng phong phú nếu mạng lỗi
const FALLBACK_JOBS = [
    {
        title: "Chuyên Viên Vận Hành Sàn TMĐT (TikTok Shop/Shopee)",
        location: "Cầu Giấy - Hà Nội",
        salary: "12–18M + thưởng"
    },
    {
        title: "Leader Vận Hành Sàn Thương Mại Điện Tử",
        location: "Đống Đa - Hà Nội",
        salary: "15–22M"
    },
    {
        title: "Nhân Viên Quản Lý Đơn Hàng & Vận Hành Sàn",
        location: "Thanh Xuân - Hà Nội",
        salary: "10–15M"
    }
];

async function scrapeJobsFromTopCV() {
    console.log(`[${new Date().toLocaleString()}] 🔍 Đang cào toàn bộ danh sách job từ TopCV...`);
    let browser;
    try {
        const executablePath = await chromium.executablePath();
        
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: executablePath || undefined,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(TOPCV_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await new Promise(resolve => setTimeout(resolve, 4000));

        const content = await page.content();
        await browser.close();

        const $ = cheerio.load(content);
        const jobs = [];

        // Duyệt qua tất cả các tin tuyển dụng hiển thị trên trang
        $('.job-item-search-result, .job-item, .box-job-item').each((i, el) => {
            const title = $(el).find('.title a span, .title a').first().text().trim();
            const salary = $(el).find('.title-salary, .salary').first().text().trim() || '12–18M + thưởng';
            const location = $(el).find('.address, .job-address').first().text().trim() || 'Hà Nội';

            if (title && !jobs.some(j => j.title === title)) {
                jobs.push({ title, salary, location });
            }
        });

        if (jobs.length > 0) {
            console.log(`[${new Date().toLocaleString()}] ✅ Cào thành công ${jobs.length} việc làm khác nhau từ TopCV.`);
            return jobs;
        }
    } catch (error) {
        if (browser) await browser.close();
        console.error(`[${new Date().toLocaleString()}] ⚠️ Lỗi cào TopCV, chuyển sang danh sách dự phòng:`, error.message);
    }

    return FALLBACK_JOBS;
}

function buildPostContent(job) {
    let locHeadline = job.location.includes('Hà Nội') ? job.location : `${job.location} - Hà Nội`;
    if (locHeadline.length > 35) locHeadline = "Cầu Giấy - Hà Nội";

    return `[${locHeadline}] Cần tuyển ${job.title}
Thời gian làm việc: Thứ 2 - Thứ 7 (8h30 - 17h, nghỉ trưa 1h30p)

Mô tả công việc:
Quản lý, điều phối hoạt động vận hành sàn TikTok Shop, Shopee.
Quản lý, phân công và giám sát team vận hành.
Theo dõi doanh thu, đơn hàng, tồn kho, tỷ lệ chuyển đổi và KPI.
Phối hợp Marketing triển khai campaign, chương trình khuyến mãi.
Phân tích số liệu, tối ưu sản phẩm và hiệu quả kinh doanh.
Đào tạo, đánh giá nhân sự và lập báo cáo vận hành.

Yêu cầu:
Có 2–3 năm kinh nghiệm vận hành sàn TMĐT, ưu tiên đã làm Leader.
Có kinh nghiệm trực tiếp vận hành TikTok Shop, Shopee.
Có khả năng phân tích số liệu, quản lý team và kiểm soát KPI.
Chủ động, tư duy logic, xử lý vấn đề tốt.

Quyền lợi:
Lương cứng ${job.salary} (deal theo năng lực).
Phụ cấp ăn trưa 25k/ngày.
Đóng BHXH, BHYT theo quy định.
Được cung cấp đầy đủ trang thiết bị làm việc.

=> Comment, chấm bài để nhận JD`;
}

async function scrapeAndPostToFacebook() {
    try {
        const jobs = await scrapeJobsFromTopCV();
        
        // Chọn ngẫu nhiên một job khác nhau trong danh sách cào được
        const selectedJob = jobs[Math.floor(Math.random() * jobs.length)];
        console.log(`[${new Date().toLocaleString()}] 🎲 Đã chọn ngẫu nhiên job: "${selectedJob.title}" (${selectedJob.location})`);
        
        const finalContent = buildPostContent(selectedJob);

        console.log(`[${new Date().toLocaleString()}] 🚀 Đang gửi bài tuyển dụng lên Group Facebook...`);

        const postRes = await axios.post(FUNC_POST_ENDPOINT, {
            text: finalContent,
            image_urls: [],
            group_id: GROUP_DICH_ID,
            text_format_preset_id: ""
        }, {
            headers: { 
                'Authorization': `Bearer ${DIRECT_TOKEN}`,
                'Content-Type': 'application/json' 
            }
        });

        console.log(`[${new Date().toLocaleString()}] 🎉 ĐĂNG BÀI THÀNH CÔNG!`, postRes.data);

    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] ❌ Lỗi khi đăng bài:`, error.response ? error.response.data : error.message);
    }
}

cron.schedule('0 8,11,14,17,20 * * *', () => scrapeAndPostToFacebook());
cron.schedule('30 9,12,15,18,21 * * *', () => scrapeAndPostToFacebook());

console.log('🤖 Bot tuyển dụng TopCV (Format Text Chuẩn) đã sẵn sàng!');
scrapeAndPostToFacebook();
