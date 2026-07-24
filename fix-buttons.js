const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'components/layout/Header.tsx',
  'components/menu/MenuItemForm.tsx',
  'components/settings/TabBranches.tsx',
  'app/(auth)/verify-email/VerifyEmailClient.tsx',
  'app/(dashboard)/staff/page.tsx',
  'features/customers/CustomersView.tsx',
  'features/inventory/InventoryView.tsx',
  'features/needle/briefing/BriefingView.tsx'
];

for (const relPath of filesToUpdate) {
  const fullPath = path.join(__dirname, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    // Replace text-white with text-accent-foreground if the line contains bg-accent
    const lines = content.split('\n');
    let modified = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('bg-accent') && lines[i].includes('text-white')) {
        // Only replace exact "text-white" so we don't mess up "text-white/40" unless it's intended, but looking at our grep, they were all exact "text-white"
        lines[i] = lines[i].replace(/\btext-white\b/g, 'text-accent-foreground');
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
      console.log(`Updated ${relPath}`);
    }
  }
}
