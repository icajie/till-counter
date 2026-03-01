export const metadata = {
  title: "Till Counter",
  description: "AUD cash till counting & reconciliation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0f0f14" }}>
        {children}
      </body>
    </html>
  );
}
