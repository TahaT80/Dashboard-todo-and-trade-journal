# ⚡ TahaEth Pro Dashboard

داشبورد شخصی مدیریت روزانه — ترید، باشگاه، تغذیه، AI و ژورنال.  
همه‌چیز توی یک فایل HTML (SPA) با بک‌اند Node.js + SQLite.

## ✨ امکانات

| بخش | توضیح |
|------|-------|
| **📊 نمای کلی** | ردیابی هفتگی، نمودار تکمیل روزانه، دونات توزیع فعالیت، استریک‌ها، تقویم ماهانه شمسی |
| **📅 برنامه** | بلاک‌های زمانی قابل ویرایش، حالت استراحت، رینگ پیشرفت، ژورنال روزانه + چک‌لیست |
| **🥗 تغذیه** | برنامه غذایی باشگاه/استراحت، ماکروها، کالری، نکات ریکامپ |
| **📈 ترید** | ثبت معامله با اسکرین‌شات، آمار وین‌ریت، منحنی سرمایه، هیت‌مپ PnL، عملکرد سشن |
| **🌗 تم تاریک/روشن** | + خروجی JSON و CSV |

## 🚀 نصب سریع

```bash
git clone https://github.com/TahaT80/Dashboard-todo-and-trade-journal.git
cd Dashboard-todo-and-trade-journal
npm install
npm start
```

برنامه روی `http://localhost:3000` اجرا میشه.  
حساب کاربری اول رو تو صفحه لاگین میسازی.

## 📦 تکنولوژی‌ها

- **بک‌اند:** Node.js + Express + SQLite (sql.js)
- **فرانت‌اند:** Vanilla JS — بدون فریم‌ورک، یک فایل HTML
- **احراز هویت:** JWT + bcrypt
- **فونت:** Vazirmatn + JetBrains Mono

## 📁 ساختار پروژه

```
├── server.js          # سرور Express + API
├── package.json
├── .env.example       # نمونه متغیرهای محیطی
├── .gitignore
├── public/
│   └── index.html     # کل فرانت‌اند (SPA)
└── README.md
```

## 🔧 استقرار روی سرور (Linux + PM2 + Nginx)

### ۱. نصب Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### ۲. آپلود و نصب
```bash
git clone https://github.com/TahaT80/Dashboard-todo-and-trade-journal.git /var/www/tahaeth
cd /var/www/tahaeth
npm install
cp .env.example .env
nano .env   # JWT_SECRET رو تغییر بده
```

### ۳. اجرای همیشگی با PM2
```bash
npm install -g pm2
pm2 start server.js --name tahaeth
pm2 startup && pm2 save
```

### ۴. نصب Nginx + SSL
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

فایل `/etc/nginx/sites-available/tahaeth`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tahaeth /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

sudo certbot --nginx -d your-domain.com
```

### ۵. بکاپ دیتابیس
```bash
0 3 * * * cp /var/www/tahaeth/data.db /var/www/tahaeth/backups/data-$(date +\%Y\%m\%d).db
```

## 🔐 متغیرهای محیطی

| متغیر | پیش‌فرض | توضیح |
|-------|---------|-------|
| `PORT` | `3000` | پورت سرور |
| `JWT_SECRET` | — | کلید امضای توکن (توی production حتماً عوض کن) |

## 🛠 عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| پورت ۳۰۰۰ بسته | `sudo ufw allow 3000` |
| Nginx 502 | `pm2 status` چک کن |
| SSL کار نمی‌کنه | `sudo certbot renew` |
| خطا در لاگ | `pm2 logs tahaeth --err` |
