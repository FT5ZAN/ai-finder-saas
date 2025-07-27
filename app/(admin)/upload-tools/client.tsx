"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';

interface Tool {
  title: string;
  logoUrl: string;
  websiteUrl: string;
  category: string;
  about: string;
  keywords: string[];
  toolType: 'browser' | 'downloadable';
}

export default function ToolsAdminForm() {
  const [tool, setTool] = useState<Tool>({
    title: "",
    logoUrl: "",
    websiteUrl: "",
    category: "",
    about: "",
    keywords: [],
    toolType: 'browser',
  });
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [envError, setEnvError] = useState<string | null>(null);
  const [autoFillLoading, setAutoFillLoading] = useState(false);

  // Debug: log the env variable
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    console.log("[client.tsx] NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY:", publicKey);
    if (!publicKey) {
      setEnvError("ImageKit public key is not configured. Please check your .env and restart the dev server.");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTool((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setResult("");
  };

  const handleImageUpload = async () => {
    if (!file) {
      setResult("⚠️ Please choose an image file");
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    if (!publicKey) {
      setResult("❌ ImageKit public key is not configured. Please check your .env and restart the dev server.");
      return;
    }

    try {
      setLoading(true);
      setResult("");
      setUploadProgress(0);

      // Get ImageKit authentication
      const authRes = await fetch("/api/image-kit");
      if (!authRes.ok) throw new Error("Failed to get ImageKit auth");
      const { signature, token, expire } = await authRes.json();

      // Prepare form data for ImageKit
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", publicKey);
      formData.append("signature", signature);
      formData.append("token", token);
      formData.append("expire", expire.toString());

      // Upload to ImageKit with progress tracking
      const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });
      console.log("[client.tsx] ImageKit upload response:", res);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const resultData = await res.json();
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        console.error("[client.tsx] ImageKit upload error:", resultData);
        throw new Error(resultData.message || "Image upload failed");
      }

      // Update tool state with the uploaded image URL
      setTool((prev) => ({ ...prev, logoUrl: resultData.url }));
      setResult("🖼️ Image uploaded successfully!");
      setFile(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResult(`❌ Image upload failed: ${errorMessage}`);
      setUploadProgress(0);
      console.error("[client.tsx] Image upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = async () => {
    if (!tool.websiteUrl || !/^https?:\/\//.test(tool.websiteUrl)) {
      setResult("⚠️ Please enter a valid Website URL first.");
      return;
    }

    try {
      setAutoFillLoading(true);
      setResult("🔍 Fetching metadata...");

      // Step 1: Fetch metadata (title, logo)
      const metaRes = await fetch("/api/auto-fill-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: tool.websiteUrl }),
      });

      const meta = await metaRes.json();

      if (!metaRes.ok) throw new Error(meta.error || "Metadata fetch failed");

      // Step 2: Extract keywords from website
      setResult("🔑 Extracting keywords...");
      const keywordsRes = await fetch("/api/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: tool.websiteUrl }),
      });

      const keywordsData = await keywordsRes.json();
      if (!keywordsRes.ok) {
        console.warn("Keywords extraction failed:", keywordsData.error);
        // Continue without keywords if extraction fails
      }

      // Step 3: Generate short about text (25 words)
      setResult("🤖 Generating short about text...");
      const shortAboutRes = await fetch("/api/generate-short-about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: meta.title || tool.title,
          description: tool.about || "AI tool", // Use about as description for AI generation
          keywords: keywordsData.keywords || []
        }),
      });

      const shortAboutData = await shortAboutRes.json();
      if (!shortAboutRes.ok) {
        console.warn("Short about generation failed:", shortAboutData.error);
        // Continue without short about if generation fails
      }

      // Step 4 (optional): Upload logo to ImageKit
      let logoUrl = meta.logoUrl;
      if (logoUrl && logoUrl.startsWith("http")) {
        setResult("🖼️ Uploading logo to ImageKit...");
        
        try {
          const imageUploadRes = await fetch("/api/image-kit", { method: "GET" });
          const auth = await imageUploadRes.json();

          const uploadForm = new FormData();
          uploadForm.append("file", logoUrl);
          uploadForm.append("fileName", "autofilled-logo.png");
          uploadForm.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "");
          uploadForm.append("signature", auth.signature);
          uploadForm.append("token", auth.token);
          uploadForm.append("expire", auth.expire);

          const imagekitUpload = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
            method: "POST",
            body: uploadForm,
          });
          const uploaded = await imagekitUpload.json();
          if (uploaded.url) logoUrl = uploaded.url;
        } catch (logoError) {
          console.warn("Logo upload failed, using original URL:", logoError);
          // Continue with original logo URL if upload fails
        }
      }

              // Step 5: Update the form state
        setTool((prev) => ({
          ...prev,
          title: meta.title || prev.title,
          about: shortAboutData.about || prev.about,
          keywords: keywordsData.keywords || prev.keywords,
          logoUrl: logoUrl || prev.logoUrl,
        }));

      setResult("✅ Auto-filled from website successfully!");
    } catch (err: unknown) {
      console.error("Auto-fill error:", err);
      setResult(`❌ Auto-fill failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!tool.title || !tool.logoUrl || !tool.websiteUrl || !tool.category || !tool.about || tool.keywords.length === 0) {
      setResult("⚠️ Please fill in all required fields (Title, Logo URL, Website URL, Category, About, and Keywords)");
      return;
    }

    // Validate keywords count
    if (tool.keywords.length < 5 || tool.keywords.length > 10) {
      setResult("⚠️ Please enter between 5 and 10 keywords");
      return;
    }

    // Validate about word count (approximately 25 words)
    const wordCount = tool.about.split(/\s+/).length;
    if (wordCount > 30) {
      setResult("⚠️ About text should be around 25 words maximum");
      return;
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(tool.websiteUrl)) {
      setResult("⚠️ Website URL must start with http:// or https:// (e.g., https://example.com)");
      return;
    }

    if (!urlPattern.test(tool.logoUrl)) {
      setResult("⚠️ Logo URL must start with http:// or https:// (e.g., https://example.com/logo.png)");
      return;
    }

    try {
      setLoading(true);
      setResult("");

      const response = await fetch("/api/tools/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([tool]),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific validation errors
        if (data.field === 'websiteUrl') {
          throw new Error("Invalid website URL. Please enter a valid URL starting with http:// or https://");
        }
        if (data.field === 'logoUrl') {
          throw new Error("Invalid logo URL. Please enter a valid URL starting with http:// or https://");
        }
        throw new Error(data.error || data.details || `Server error: ${response.status}`);
      }

      setResult(`✅ Successfully added ${data.insertedCount} tool${data.insertedCount > 1 ? "s" : ""}!`);
      
      // Reset form
      setTool({ 
        title: "", 
        logoUrl: "", 
        websiteUrl: "", 
        category: "", 
        about: "", 
        keywords: [],
        toolType: 'browser' 
      });
      setFile(null);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setResult(`❌ Upload failed: ${errorMessage}`);
      console.error("[client.tsx] Tool upload failed:", err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0f0f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        padding: "24px",
        width: "100%",
        maxWidth: "600px",
        height: "155vh",
      }}>
        <h1 style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#333",
          marginBottom: "24px",
          textAlign: "center",
        }}>Add New Tool</h1>

        {envError && (
          <div style={{ color: "#dc3545", marginBottom: 16, textAlign: "center" }}>{envError}</div>
        )}

        <div style={{ display: "grid", gap: "16px" }}>
          {/* Auto-Fill Button */}
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={autoFillLoading || !tool.websiteUrl}
            style={{
              backgroundColor: autoFillLoading || !tool.websiteUrl ? "#ccc" : "#28a745",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: autoFillLoading || !tool.websiteUrl ? "not-allowed" : "pointer",
              border: "none",
              marginBottom: "8px",
              width: "100%",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => {
              if (!autoFillLoading && tool.websiteUrl) {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = "#218838";
              }
            }}
            onMouseOut={(e) => {
              if (!autoFillLoading && tool.websiteUrl) {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = "#28a745";
              }
            }}
          >
            {autoFillLoading ? "🔄 Auto-Filling..." : "✨ Auto-Fill From Website"}
          </button>
          
          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "4px",
            }}>Tool Name *</label>
            <input
              name="title"
              placeholder="Enter tool name"
              value={tool.title}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px",
                transition: "border-color 0.2s",
              }}
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#007bff"}
              onBlur={(e) => e.target.style.borderColor = "#ccc"}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "4px",
            }}>Logo Image</label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "16px",
                }}
                disabled={loading}
              />
              <button
                onClick={handleImageUpload}
                disabled={loading || !file}
                style={{
                  backgroundColor: loading || !file ? "#ccc" : "#007bff",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontSize: "16px",
                  cursor: loading || !file ? "not-allowed" : "pointer",
                  border: "none",
                  transition: "background-color 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => {
                  if (!loading && file) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = "#0056b3";
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading && file) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = "#007bff";
                  }
                }}
              >
                {loading && uploadProgress > 0 ? `Uploading (${uploadProgress}%)` : "Upload Image"}
              </button>
            </div>
            {tool.logoUrl && (
              <div style={{ marginTop: "8px" }}>
                                 <Image
                   src={tool.logoUrl}
                   alt="Uploaded logo"
                   width={64}
                   height={64}
                   quality={100}
                   unoptimized={true}
                 />
              </div>
            )}
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "4px",
            }}>Logo URL *</label>
            <input
              name="logoUrl"
              placeholder="Image URL will appear here after upload (must start with http:// or https://)"
              value={tool.logoUrl}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px",
                backgroundColor: "#f8f8f8",
                transition: "border-color 0.2s",
              }}
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#007bff"}
              onBlur={(e) => e.target.style.borderColor = "#ccc"}
            />
            <small style={{ color: "#666", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Must be a valid URL starting with http:// or https://
            </small>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "4px",
            }}>Website URL *</label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <input
                name="websiteUrl"
                placeholder="https://example.com (must start with http:// or https://)"
                value={tool.websiteUrl}
                onChange={handleChange}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "16px",
                  transition: "border-color 0.2s",
                }}
                disabled={loading || autoFillLoading}
                onFocus={(e) => e.target.style.borderColor = "#007bff"}
                onBlur={(e) => e.target.style.borderColor = "#ccc"}
              />
              <button
                onClick={handleAutoFill}
                disabled={loading || autoFillLoading || !tool.websiteUrl}
                style={{
                  backgroundColor: loading || autoFillLoading || !tool.websiteUrl ? "#ccc" : "#28a745",
                  color: "#fff",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: loading || autoFillLoading || !tool.websiteUrl ? "not-allowed" : "pointer",
                  border: "none",
                  transition: "background-color 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => {
                  if (!loading && !autoFillLoading && tool.websiteUrl) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = "#218838";
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading && !autoFillLoading && tool.websiteUrl) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = "#28a745";
                  }
                }}
              >
                {autoFillLoading ? "🔄 Auto-Filling..." : "✨ Auto-Fill"}
              </button>
            </div>
            <small style={{ color: "#666", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Must be a valid URL starting with http:// or https:// • Enter URL first, then click &quot;Auto-Fill From Website&quot; above
            </small>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "4px",
            }}>Category *</label>
            <input
              name="category"
              placeholder="e.g., Image, Code, Chat"
              value={tool.category}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px",
                transition: "border-color 0.2s",
              }}
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#007bff"}
              onBlur={(e) => e.target.style.borderColor = "#ccc"}
            />
          </div>



          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "4px",
            }}>Keywords (5-10) *</label>
            <input
              name="keywords"
              placeholder="ai, resume builder, cv generator, professional resumes, career tools"
              value={tool.keywords.join(', ')}
              onChange={(e) => {
                const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0);
                setTool(prev => ({ ...prev, keywords }));
              }}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px",
                transition: "border-color 0.2s",
              }}
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#007bff"}
              onBlur={(e) => e.target.style.borderColor = "#ccc"}
            />
            <small style={{ color: "#666", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Enter 5-10 keywords separated by commas. These help users find your tool when searching.
            </small>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "4px",
            }}>About (25 words) *</label>
            <textarea
              name="about"
              placeholder="Short, compelling description highlighting the tool's unique value proposition (USP)"
              value={tool.about}
              onChange={handleChange}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px",
                transition: "border-color 0.2s",
                resize: "vertical",
              }}
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#007bff"}
              onBlur={(e) => e.target.style.borderColor = "#ccc"}
            />
            <small style={{ color: "#666", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Exactly 25 words maximum. Focus on the main benefit and unique selling proposition.
            </small>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "4px",
            }}>Tool Type</label>
            <select
              name="toolType"
              value={tool.toolType}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px",
                transition: "border-color 0.2s",
              }}
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#007bff"}
              onBlur={(e) => e.target.style.borderColor = "#ccc"}
            >
              <option value="browser">Browser-based</option>
              <option value="downloadable">Downloadable</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || autoFillLoading}
            style={{
              backgroundColor: loading || autoFillLoading ? "#ccc" : "#007bff",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading || autoFillLoading ? "not-allowed" : "pointer",
              border: "none",
              transition: "background-color 0.2s",
              textAlign: "center",
            }}
            onMouseOver={(e) => {
              if (!loading && !autoFillLoading) {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = "#0056b3";
              }
            }}
            onMouseOut={(e) => {
              if (!loading && !autoFillLoading) {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = "#007bff";
              }
            }}
          >
            {loading ? "Submitting..." : autoFillLoading ? "Auto-Filling..." : "Submit Tool"}
          </button>

          {result && (
            <p style={{
              fontSize: "14px",
              marginTop: "16px",
              textAlign: "center",
              color: result.includes("✅") ? "#28a745" : "#dc3545",
            }}>
              {result}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}