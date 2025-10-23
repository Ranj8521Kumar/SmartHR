# PowerShell script to convert .tsx files to .jsx
# This script removes TypeScript type annotations

$files = @(
    "F:\SmartHR frontend\src\components\dashboards\AdminDashboard.tsx",
    "F:\SmartHR frontend\src\components\dashboards\EmployeeDashboard.tsx",
    "F:\SmartHR frontend\src\components\dashboards\HRManagerDashboard.tsx",
    "F:\SmartHR frontend\src\components\dashboards\ManagerDashboard.tsx",
    "F:\SmartHR frontend\src\components\figma\ImageWithFallback.tsx",
    "F:\SmartHR frontend\src\components\layout\DashboardLayout.tsx",
    "F:\SmartHR frontend\src\components\layout\Sidebar.tsx",
    "F:\SmartHR frontend\src\components\layout\TopNav.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $newFile = $file -replace '\.tsx$', '.jsx'
        
        # Remove TypeScript type annotations
        # Remove interface/type definitions
        $content = $content -replace '(?s)^(interface|type)\s+\w+.*?;?\s*(\{[^\}]*\}|=.*?;)', ''
        
        # Remove type annotations from function parameters
        $content = $content -replace '(\w+):\s*[\w\[\]<>|&\s]+(\)|,|=)', '$1$2'
        
        # Remove return type annotations
        $content = $content -replace '\):\s*[\w\[\]<>|&\s]+\s*\{', ') {'
        
        # Remove generic type parameters
        $content = $content -replace '<[\w\s,<>]+>(?=\()', ''
        
        # Remove type assertions
        $content = $content -replace '\s+as\s+[\w\[\]<>|&\s]+', ''
        
        # Remove non-null assertions
        $content = $content -replace '!\.', '.'
        $content = $content -replace '!\)', ')'
        $content = $content -replace '!;', ';'
        
        # Save to new file
        Set-Content -Path $newFile -Value $content -NoNewline
        
        Write-Host "Converted: $file -> $newFile"
    }
}

Write-Host "`nConversion complete! Please review the files and fix any issues."
