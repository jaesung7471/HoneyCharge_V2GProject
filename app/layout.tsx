import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GridFlow | 제주·호남 V2G 에너지 운영",
  description:
    "재생에너지 잉여 전력과 전기차 유휴 배터리를 연결하는 설명 가능한 V2G 운영 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
