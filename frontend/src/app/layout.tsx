import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "../providers/AppProviders";

export const metadata: Metadata = {
  title: "HRMS - Human Resource Management System",
  description: "Enterprise HRMS Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var blocked = ['bis_skin_checked', 'bis_register', '__processed_'];
                  var origSetAttr = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, value) {
                    for (var i = 0; i < blocked.length; i++) {
                      if (name.indexOf(blocked[i]) === 0) return;
                    }
                    return origSetAttr.call(this, name, value);
                  };
                  if (typeof MutationObserver !== 'undefined') {
                    var observer = new MutationObserver(function(mutations) {
                      for (var j = 0; j < mutations.length; j++) {
                        var m = mutations[j];
                        if (m.type === 'attributes' && m.attributeName) {
                          for (var k = 0; k < blocked.length; k++) {
                            if (m.attributeName.indexOf(blocked[k]) === 0) {
                              m.target.removeAttribute(m.attributeName);
                              break;
                            }
                          }
                        }
                      }
                    });
                    observer.observe(document.documentElement, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['bis_skin_checked', 'bis_register']
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="font-sans antialiased bg-gray-50 text-gray-900 min-h-screen"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
