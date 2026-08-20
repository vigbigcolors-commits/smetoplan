import '../constructix.css';

/** Calculator-only CSS — keep off homepage critical path. */
export default function KalkulyatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
