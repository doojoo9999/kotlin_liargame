const buildStyleString = (element: Element) => {
  const computed = window.getComputedStyle(element);
  return Array.from(computed)
    .map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
    .join("");
};

const inlineStyles = (source: Element, clone: Element) => {
  if (!(clone instanceof HTMLElement) || !(source instanceof HTMLElement)) return;
  clone.setAttribute("style", buildStyleString(source));
  const sourceChildren = Array.from(source.children);
  const cloneChildren = Array.from(clone.children);
  sourceChildren.forEach((child, index) => {
    const cloneChild = cloneChildren[index];
    if (cloneChild) inlineStyles(child, cloneChild);
  });
};

const serializeNode = (node: HTMLElement) => {
  const clone = node.cloneNode(true) as HTMLElement;
  inlineStyles(node, clone);
  return new XMLSerializer().serializeToString(clone);
};

export async function exportElementAsPng(target: HTMLElement, filename: string) {
  const bounds = target.getBoundingClientRect();
  const width = Math.ceil(bounds.width);
  const height = Math.ceil(bounds.height);
  if (!width || !height) {
    throw new Error("내보낼 영역의 크기를 확인할 수 없습니다.");
  }

  const serialized = serializeNode(target);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n  <foreignObject width="100%" height="100%">\n    ${serialized}\n  </foreignObject>\n</svg>`;
  const blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
  const url = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("캔버스 컨텍스트를 가져올 수 없습니다.");
    ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor || "#0f172a";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0);

    const pngBlob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("이미지 변환에 실패했습니다."));
      }, "image/png");
    });

    const downloadUrl = URL.createObjectURL(pngBlob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}
