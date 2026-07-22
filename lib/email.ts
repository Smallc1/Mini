import nodemailer from "nodemailer";

export async function sendPasswordResetCode(to: string, code: string) {
  const user = process.env.QQ_SMTP_USER;
  const pass = process.env.QQ_SMTP_AUTH_CODE;
  if (!user || !pass) throw new Error("QQ SMTP 未配置");
  const transporter = nodemailer.createTransport({ host: "smtp.qq.com", port: 465, secure: true, auth: { user, pass } });
  await transporter.sendMail({
    from: `迷你商城 <${user}>`, to, subject: "迷你商城密码重置验证码",
    text: `你的密码重置验证码是：${code}。验证码 10 分钟内有效。如非本人操作，请忽略此邮件。`,
    html: `<div style="font-family:sans-serif;line-height:1.7"><h2>重置密码</h2><p>你的验证码是：</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p></div>`,
  });
}
