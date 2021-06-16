// Function:
const getLocalFavicon = async () => {
  try {
    let nodes = [], crudeNodes = document.querySelectorAll('link[rel*="icon"]');
    for (const [ index, crudeNode ] of crudeNodes.entries()) {
      nodes[ index ] = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            URL: crudeNode.href,
            width: img.width,
            height: img.height
          });
        };
        img.src = crudeNode.href;
      });
    }
    return nodes.find(node => node.width === Math.max.apply(Math, nodes.map(node => node.width))).URL;
  } catch {
    return null;
  }
};


// Exports:
export default getLocalFavicon;
