<?php
$file = 'config.lua';
$contents = file_get_contents($file);

// Look for "setting = true" or "setting = false"
if (strpos($contents, 'setting = true') !== false) {
    $newContents = str_replace('setting = true', 'setting = false', $contents);
} else {
    $newContents = str_replace('setting = false', 'setting = true', $contents);
}

file_put_contents($file, $newContents);
echo "Setting toggled!";
?>
