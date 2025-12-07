import { Metadata } from "next";
import HomePage from "@/components/client/Homepage";

export const metadata: Metadata = {
  title: "Poly Smart - Đại lý ủy quyền Apple chính hãng | iPhone, iPad, MacBook",
  description: "Poly Smart - Đại lý ủy quyền Apple chính hãng tại Việt Nam. Chuyên cung cấp iPhone, iPad, MacBook, Apple Watch, AirPods chính hãng với giá tốt nhất. Giao hàng toàn quốc, bảo hành chính hãng.",
  keywords: [
    "iPhone chính hãng",
    "iPad chính hãng", 
    "MacBook chính hãng",
    "Apple Watch",
    "AirPods",
    "đại lý Apple",
    "cửa hàng Apple",
    "Poly Smart",
    "Apple Việt Nam",
    "iPhone 15",
    "iPhone 15 Pro",
    "iPhone 15 Pro Max",
    "iPad Pro",
    "MacBook Pro",
    "MacBook Air"
  ],
  openGraph: {
    title: "Poly Smart - Đại lý ủy quyền Apple chính hãng",
    description: "Đại lý ủy quyền Apple chính hãng tại Việt Nam. Chuyên cung cấp iPhone, iPad, MacBook, Apple Watch, AirPods với giá tốt nhất.",
    url: "https://polysmart.nghiaht.io.vn",
    siteName: "Poly Smart",
    images: [
      {
        url: "/images/logo/logo.png",
        width: 1200,
        height: 630,
        alt: "Poly Smart - Đại lý Apple chính hãng",
      }
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Poly Smart - Đại lý ủy quyền Apple chính hãng",
    description: "Đại lý ủy quyền Apple chính hãng tại Việt Nam. Chuyên cung cấp iPhone, iPad, MacBook, Apple Watch, AirPods với giá tốt nhất.",
    images: ["/images/logo/logo.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <HomePage />;
}