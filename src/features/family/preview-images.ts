// Browser resources are not serializable state. Redux stores only their URL strings.
const imageUrls = new Set<string>()
export function previewImage(file: File) {
  const url = URL.createObjectURL(file)
  imageUrls.add(url)
  return url
}
export function releasePreviewImages() {
  imageUrls.forEach((url) => URL.revokeObjectURL(url))
  imageUrls.clear()
}
