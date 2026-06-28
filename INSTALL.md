# 🚀 راهنمای نصب TahaEth Pro روی سرور لینوکس

## پیش‌نیازها
- سرور لینوکس (Ubuntu 20.04+ / Debian 11+)
- دسترسی root یا sudo
- دامنه (اختیاری ولی پیشنهادی)

---

## مرحله ۱: نصب Node.js

```bash
# نصب Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# بررسی نصب
node -v
npm -v
```

---

## مرحله ۲: آپلود فایل‌ها

```bash
# ساخت پوشه پروژه
sudo mkdir -p /var/www/tahaeth
sudo chown $USER:$USER /var/www/tahaeth

# آپلود فایل‌ها (از کامپیوتر خودت)
# روش ۱: با scp
scp -r /path/to/web/* user@server-ip:/var/www/tahaeth/

# روش ۲: با git (اگه ریپو داری)
cd /var/www/tahaeth
git clone https://github.com/your-repo.git .

# روش ۳: آپلود دستی با FileZilla یا WinSCP
```

فایل‌هایی که باید آپلود بشن:
```
/var/www/tahaeth/
├── server.js
├── package.json
└── public/
    └── index.html
```

---

## مرحله ۳: نصب پکیج‌ها

```bash
cd /var/www/tahaeth
npm install
```

---

## مرحله ۴: تنظیم متغیرهای محیطی

```bash
# ساخت فایل env
nano /var/www/tahaeth/.env
```

محتوای فایل:
```env
PORT=3000
JWT_SECRET=یک-رمز-طولانی-و-تصادفی-اینجا-بنویس
```

> ⚠️ حتماً یک رمز قوی و تصادفی برای `JWT_SECRET` انتخاب کن.

---

## مرحله ۵: تست اجرای برنامه

```bash
cd /var/www/tahaeth
node server.js
```

اگه پیام `🚀 TahaEth Pro running on http://localhost:3000` رو دیدی، یعنی درسته.
با `Ctrl+C` متوقفش کن.

---

## مرحله ۶: راه‌اندازی با PM2 (اجرای دائمی)

```bash
# نصب PM2
sudo npm install -g pm2

# اجرای برنامه
cd /var/www/tahaeth
pm2 start server.js --name tahaeth

# تنظیم اجرای خودکار بعد از ریستارت
pm2 startup
pm2 save

# دستورات مفید PM2
pm2 status          # وضعیت برنامه
pm2 logs tahaeth    # لاگ‌ها
pm2 restart tahaeth # ریستارت
pm2 stop tahaeth    # توقف
```

---

## مرحله ۷: نصب Nginx (reverse proxy)

```bash
sudo apt install -y nginx
```

### تنظیم Nginx

```bash
sudo nano /etc/nginx/sites-available/tahaeth
```

محتوای فایل (بدون SSL):
```nginx
server {
    listen 80;
    server_name your-domain.com;  # دامنه خودت رو بنویس

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
# فعال‌سازی سایت
sudo ln -s /etc/nginx/sites-available/tahaeth /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # حذف سایت پیش‌فرض

# تست تنظیمات
sudo nginx -t

# ریستارت Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## مرحله ۸: تنظیم فایروال

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## مرحله ۹: SSL رایگان با Let's Encrypt (پیشنهادی)

```bash
# نصب Certbot
sudo apt install -y certbot python3-certbot-nginx

# دریافت گواهی SSL
sudo certbot --nginx -d your-domain.com

# تنظیم تمدید خودکار
sudo certbot renew --dry-run
```

بعد از نصب SSL، سایتت با `https://your-domain.com` قابل دسترسیه.

---

## مرحله ۱۰: بکاپ دیتابیس

```bash
# بکاپ دستی
cp /var/www/tahaeth/data.db /var/www/tahaeth/data.db.backup-$(date +%Y%m%d)

# بکاپ خودکار روزانه (کرون جاب)
crontab -e
```

اضافه کردن این خط:
```bash
0 3 * * * cp /var/www/tahaeth/data.db /var/www/tahaeth/backups/data-$(date +\%Y\%m\%d).db
```

```bash
# ساخت پوشه بکاپ
mkdir -p /var/www/tahaeth/backups
```

---

## دستورات مفید

```bash
# وضعیت سرویس‌ها
pm2 status
sudo systemctl status nginx

# لاگ‌ها
pm2 logs tahaeth --lines 50
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# ریستارت همه
pm2 restart tahaeth
sudo systemctl restart nginx

# آپدیت برنامه
cd /var/www/tahaeth
git pull  # اگه از git استفاده میکنی
npm install
pm2 restart tahaeth
```

---

## عیب‌یابی

| مشکل | راه حل |
|-------|--------|
| پورت 3000 بسته‌ست | `sudo ufw allow 3000` |
| Nginx 502 Bad Gateway | بررسی کن PM2 در حال اجرا باشه: `pm2 status` |
| دیتابیس قفل شده | `pm2 restart tahaeth` |
| SSL کار نمیکنه | `sudo certbot renew` |
| لاگ خطا داری | `pm2 logs tahaeth --err` |

---

## ساختار نهایی سرور

```
/var/www/tahaeth/
├── server.js          # سرور اصلی
├── package.json       # پکیج‌ها
├── .env               # متغیرهای محیطی
├── data.db            # دیتابیس SQLite
├── backups/           # بکاپ‌ها
└── public/
    └── index.html     # فرانت‌اند
```

🎉 **تمام!** برنامه آماده‌ست.
