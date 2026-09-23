import "./globals.css";

export const metadata = {
  title: "Haber Panosu",
  description: "Belirlenen sitelerden, belirlenen konularda otomatik toplanan haberler",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
