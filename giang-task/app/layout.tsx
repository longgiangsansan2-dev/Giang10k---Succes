
import React from 'react';
import { getSupabasePublicEnv } from '../lib/supabase/publicEnv';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vì đây là Server Component, process.env sẽ lấy giá trị thực tế tại runtime
  const { url, anonKey } = getSupabasePublicEnv();

  return (
    <html lang="vi">
      <head>
        {/* Inject biến môi trường vào window object trước khi JS bundle thực thi */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__SUPABASE_PUBLIC_ENV__ = {
                url: ${JSON.stringify(url)},
                anonKey: ${JSON.stringify(anonKey)}
              };
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
