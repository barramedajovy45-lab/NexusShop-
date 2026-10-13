import diamondGemImg from './images/mlbb_diamond_gem_1789737288152.jpg';
import diamondPouchImg from './images/diamond_pouch_bag_1789737331574.jpg';
import diamondChestImg from './images/diamond_chest_stack_1789737302705.jpg';
import diamondPassImg from './images/diamond_pass_ticket_1789737316231.jpg';

export { diamondGemImg, diamondPouchImg, diamondChestImg, diamondPassImg };

/**
 * Returns the best high-definition 3D game asset image for any diamond package or order
 */
export function getDiamondAssetForPackage(pkg?: {
  id?: string;
  diamonds?: number;
  isPass?: boolean;
  name?: string;
  packageName?: string;
}): string {
  if (!pkg) return diamondGemImg;

  const isPass =
    pkg.isPass ||
    pkg.id?.includes('pass') ||
    pkg.id === 'pkg_wdp' ||
    pkg.name?.toLowerCase().includes('pass') ||
    pkg.packageName?.toLowerCase().includes('pass');

  if (isPass) {
    return diamondPassImg;
  }

  const diamonds = pkg.diamonds || 0;
  if (diamonds >= 700) {
    return diamondChestImg;
  }
  if (diamonds >= 100) {
    return diamondPouchImg;
  }
  return diamondGemImg;
}
