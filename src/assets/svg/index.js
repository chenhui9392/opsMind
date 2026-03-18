import { IconPaths } from './IconPaths';

// 创建SVG元素的函数
export const createSvgElement = (iconName, options = {}) => {
  const icon = IconPaths[iconName];
  if (!icon) {
    console.warn(`Icon ${iconName} not found`);
    return null;
  }

  const { width = 20, height = 20, className = '', color = 'currentColor' } = options;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', icon.viewBox);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', color);
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  
  if (className) {
    svg.setAttribute('class', className);
  }

  icon.paths.forEach(pathData => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    svg.appendChild(path);
  });

  return svg;
};

// 导出所有图标
export { IconPaths };
