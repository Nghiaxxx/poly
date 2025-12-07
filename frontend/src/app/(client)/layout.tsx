import { ReactNode } from 'react';

export default function ClientLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <div className="pt-16">{children}</div>;
}