# TahaEth Pro Dashboard

داشبورد شخصی مدیریت روزانه — ترید، باشگاه، تغذیه، AI و ژورنال.

## امکانات

- 📊 **نمای کلی** — ردیابی هفتگی، نمودار تکمیل، توزیع فعالیت، استریک‌ها
- 📅 **برنامه روزانه** — بلاک‌های زمانی با قابلیت ویرایش، حالت استراحت
- 🥗 **تغذیه** — برنامه غذایی باشگاه و استراحت با ماکروها
- 📝 **ژورنال** — یادداشت روزانه، چک‌لیست، حال روز
- 📈 **ترید** — ثبت معاملات، آمار وین ریت، نمودار PnL، هیت‌مپ، عملکرد سشن
- 🌗 **تم تاریک و روشن**
- 📱 **ریسپانسیو** — مناسب گوشی و دسکتاپ
- 🔄 **تقویم شمسی**
- 📤 **خروجی JSON و CSV**

## نصب سریع

```bash
# کلون کردن
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# نصب پکیج‌ها
npm install

# اجرا
npm start
```

برنامه روی `http://localhost:3000` اجرا میشه.

## ساختار پروژه

```
├── server.js          # سرور Express + SQLite
├── package.json       # پکیج‌ها
├── public/
│   └── index.html     # فرانت‌اند (SPA)
├── .gitignore
└── INSTALL.md         # راهنمای نصب روی سرور
```

## نصب روی سرور

راهنمای کامل نصب روی سرور لینوکس با PM2 و Nginx در [INSTALL.md](INSTALL.md) موجوده.

## تکنولوژی‌ها

- **Backend:** Node.js + Express + SQLite (sql.js)
- **Frontend:** HTML/CSS/JS (Vanilla SPA)
- **Auth:** JWT + bcrypt
- **Font:** Vazirmatn + JetBrains Mono
