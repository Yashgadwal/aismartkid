<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap | AI Smart Kids Ujjain</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1E293B;
            background-color: #F8FAFC;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: #FFFFFF;
            padding: 32px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(37,99,235,0.03);
            border: 1px solid rgba(37,99,235,0.08);
          }
          h1 {
            font-size: 28px;
            margin: 0 0 10px 0;
            color: #0F172A;
            font-weight: 800;
          }
          p {
            font-size: 14px;
            color: #64748B;
            margin: 0 0 30px 0;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            margin-top: 10px;
          }
          th {
            background-color: #F1F5F9;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 12px 16px;
            border-bottom: 2px solid #E2E8F0;
          }
          td {
            padding: 14px 16px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 13.5px;
          }
          tr:hover td {
            background-color: rgba(37,99,235,0.02);
          }
          a {
            color: #2563EB;
            text-decoration: none;
            font-weight: 600;
          }
          a:hover {
            text-decoration: underline;
          }
          .badge {
            background-color: rgba(37,99,235,0.06);
            color: #2563EB;
            padding: 3px 8px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>XML Sitemap</h1>
          <p>This styled sitemap contains <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs, fully optimized for search engine crawl efficiency.</p>
          <table>
            <thead>
              <tr>
                <th>URL Address</th>
                <th>Last Modified</th>
                <th>Change Frequency</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <xsl:variable name="itemURL">
                      <xsl:value-of select="sitemap:loc"/>
                    </xsl:variable>
                    <a href="{$itemURL}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <span class="badge">
                      <xsl:value-of select="sitemap:priority"/>
                    </span>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
