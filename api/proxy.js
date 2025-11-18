async function loadVideos() {
  try {
    const res = await fetch("/api/proxy");

    if (!res.ok) {
      throw new Error("Proxy returned error");
    }

    const json = await res.json();

    // قراءة البيانات صح
    const data = json.data || json;

    console.log("DATA LOADED:", data);

    // لو عايز توصل للروابط
    data.forEach(year => {
      (year.subjects || []).forEach(sub => {
        (sub.chapters || []).forEach(ch => {
          (ch.lectures || []).forEach(lec => {
            (lec.videos || []).forEach(video => {
              console.log("📌 فيديو:", video.video_name);
              console.log("🔗 اللينكات:", video.links);
            });
          });
        });
      });
    });

  } catch (error) {
    console.error("❌ Error loading videos:", error);
    alert("حدث خطأ أثناء تحميل البيانات");
  }
}
