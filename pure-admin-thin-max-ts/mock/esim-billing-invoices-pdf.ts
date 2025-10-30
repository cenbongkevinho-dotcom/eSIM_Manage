import { defineFakeRoute } from "vite-plugin-fake-server/client";

/**
 * 发票 PDF 下载接口 Mock（GET /api/billing/invoices/:id/pdf）
 * 说明：
 * - 使用 rawResponse 返回真实的 PDF 二进制，并设置合适的响应头；
 * - PDF 内容为可见文本的最小示例（"Dummy PDF"），方便开发与测试；
 * - 仅在开发环境生效（vite-plugin-fake-server 的 client 端支持 rawResponse）。
 */
export default defineFakeRoute([
  {
    url: "/api/billing/invoices/:id/pdf",
    method: "get",
    /**
     * 将最小有效 PDF 的 Base64 字符串转为 Buffer
     * 来源参考：A very small PDF for testing（包含可见文本 Dummy PDF）
     * @returns PDF 二进制 Buffer
     */

    rawResponse: (req, res) => {
      /**
       * 解析查询字符串中的模式参数（mode），用于控制 Content-Disposition。
       * 支持：attachment（默认下载）与 inline（内联预览）。
       * @param urlPath 请求路径，可能包含查询字符串
       * @returns "inline" 或 "attachment"
       */
      function resolveDispositionMode(
        urlPath: string
      ): "inline" | "attachment" {
        try {
          const u = new URL(urlPath, "http://localhost");
          const mode = (
            u.searchParams.get("mode") || "attachment"
          ).toLowerCase();
          return mode === "inline" ? "inline" : "attachment";
        } catch {
          return "attachment";
        }
      }
      /**
       * 从请求 URL 中提取发票 ID（例如 /api/billing/invoices/inv-2/pdf => inv-2）
       * @param urlPath 请求路径
       * @returns 发票 ID（默认 inv-1）
       */
      function extractInvoiceId(urlPath: string): string {
        // 函数级注释：使用 WHATWG URL 解析 pathname，可确保保留百分号编码（不被自动解码）
        try {
          const u = new URL(urlPath, "http://localhost");
          const m = u.pathname.match(/\/api\/billing\/invoices\/([^/]+)\/pdf/);
          return m ? m[1] : "inv-1";
        } catch {
          const match = urlPath.match(/\/api\/billing\/invoices\/([^/]+)\/pdf/);
          return match ? match[1] : "inv-1";
        }
      }

      /**
       * 将 Base64 字符串安全转换为 Buffer
       * @param base64 Base64 编码字符串
       * @returns Node.js Buffer
       */
      function base64ToBuffer(base64: string): Buffer {
        return Buffer.from(base64.replace(/\s+/g, ""), "base64");
      }

      // 最小可见文本 PDF（Dummy PDF）Base64，参考：https://www.emcken.dk/programming/2024/01/12/very-small-pdf-for-testing/
      const MINIMAL_PDF_BASE64 =
        "JVBERi0xLjQKMSAwIG9iago8PC9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNSAwIFIKL1Jlc291cmNlcyA8PC9Qcm9jU2V0IFsvUERGIC9UZXh0XQovRm9udCA8PC9GMSA0IDAgUj4+Cj4+Cj4+CmVuZG9iago0IDAgb2JqCjw8L1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9OYW1lIC9GMQovQmFzZUZvbnQgL0hlbHZldGljYQovRW5jb2RpbmcgL01hY1JvbWFuRW5jb2RpbmcKPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDUzCj4+CnN0cmVhbQpCVAovRjEgMjAgVGYKMjIwIDQwMCBUZAooRHVtbXkgUERGKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDA5IDAwMDAwIG4KMDAwMDAwMDA2MyAwMDAwMCBuCjAwMDAwMDAxMjQgMDAwMDAgbgowMDAwMDAwMjc3IDAwMDAwIG4KMDAwMDAwMDM5MiAwMDAwMCBuCnRyYWlsZXIKPDwvU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0OTUKJSVFT0YK";

      const id = extractInvoiceId(req.url || "");
      const pdfBuffer = base64ToBuffer(MINIMAL_PDF_BASE64);
      const dispositionMode = resolveDispositionMode(req.url || "");

      // 设置响应头，指示为 PDF 文件且建议下载文件名
      res.setHeader("Content-Type", "application/pdf");
      // 函数级注释：filename 中保留百分号编码，避免特殊字符（如 # ? % & " 空格）破坏头部格式
      const safeFilename = `invoice-${id}.pdf`;
      // 同时提供 RFC 5987 的扩展参数 filename*，以提升非 ASCII 文件名在各浏览器下的显示友好度
      // 做法：先基于 path 段还原原始 ID（保持特殊字符），再对完整文件名进行 UTF-8 百分号编码
      let filenameStar = "";
      try {
        const decodedId = decodeURIComponent(id);
        const fullName = `invoice-${decodedId}.pdf`;
        filenameStar = `filename*=UTF-8''${encodeURIComponent(fullName)}`;
      } catch {
        // 回退：若解析失败则不提供 filename*，避免返回无效参数
        filenameStar = "";
      }
      res.setHeader(
        "Content-Disposition",
        `${dispositionMode}; filename=${safeFilename}${filenameStar ? "; " + filenameStar : ""}`
      );
      res.setHeader("Content-Length", String(pdfBuffer.length));

      // 写入二进制并结束响应
      res.end(pdfBuffer);
    }
  }
]);
