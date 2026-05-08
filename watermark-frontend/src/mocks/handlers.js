import { http, HttpResponse, delay } from 'msw'

const BASE_URL = 'http://127.0.0.1:8000'

// 模擬資料庫
let mockImages = [{ id: "img_01", original_filename: "範例圖片.jpg", blob_url: "https://picsum.photos/seed/1/300/200", created_at: "2026-03-23" }];
let mockTasks = [];
let sessionUser = { username: "Guest" };

export const handlers = [
    // --- Auth 模組 ---
    http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
        const body = await request.json();
        sessionUser.username = body.username; // 模擬存入資料庫
        await delay(500);
        return HttpResponse.json({ id: "u_new", username: body.username, email: body.email }, { status: 201 });
    }),

    http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
        const body = await request.json();
        sessionUser.username = body.username; // 登入後更新 Session
        return HttpResponse.json({ access_token: "mock_jwt_token", token_type: "bearer" });
    }),

    http.get(`${BASE_URL}/auth/me`, () => HttpResponse.json({ ...sessionUser, id: "u_current", is_active: true })),

    // --- 圖片模組 ---
    http.get(`${BASE_URL}/images/`, () => HttpResponse.json(mockImages)),
    http.post(`${BASE_URL}/images/upload`, async ({ request }) => {
        const data = await request.formData();
        const file = data.get('file');
        const newImg = { id: `img_${Math.random().toString(36).slice(2, 6)}`, original_filename: file.name, blob_url: URL.createObjectURL(file), created_at: new Date().toISOString() };
        mockImages.unshift(newImg);
        return HttpResponse.json(newImg, { status: 201 });
    }),

    // --- 任務模組 ---
    http.get(`${BASE_URL}/embed/`, () => HttpResponse.json(mockTasks)),
    http.post(`${BASE_URL}/embed/`, async ({ request }) => {
        const body = await request.json();
        const newTask = { id: `task_${Math.random().toString(36).slice(2, 6)}`, status: "pending", metadata_json: JSON.stringify({ image_id: body.image_id, secret: body.stegastamp_secret }), created_at: new Date().toISOString() };
        mockTasks.unshift(newTask);
        return HttpResponse.json(newTask, { status: 202 });
    }),

    // --- 驗證模組 ---
    http.post(`${BASE_URL}/verify/`, () => HttpResponse.json({ summary: { editguard_intact: true, copyright_match: true }, mask_url: "https://via.placeholder.com/400x200/ff0000/ffffff?text=Tamper+Map" }, { status: 201 })),
]