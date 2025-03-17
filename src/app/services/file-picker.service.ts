import { Injectable } from '@angular/core';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

@Injectable({
  providedIn: 'root',
})
export class FilePickerService {
  async pickFile(): Promise<{name: string, blob: string} | null> {
    try {
      // Open the file dialog to select a file
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'All Files', extensions: ['png', 'jpg', 'jpeg', 'pdf'] }],
      });

      if (filePath && typeof filePath === 'string') {
        // Send the file path to the Rust backend to encode it to Base64
        const base64Data: {name: string, blob: string} = await invoke('encode_file_to_base64', { filePath });
        return base64Data;
      }

      return null;
    } catch (error) {
      console.error('Error picking file:', error);
      return null;
    }
  }
}
