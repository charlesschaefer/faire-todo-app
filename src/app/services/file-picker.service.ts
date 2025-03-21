import { Injectable } from '@angular/core';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { AttachmentType } from '../dto/task-attachment-dto';

@Injectable({
    providedIn: 'root',
})
export class FilePickerService {
    async pickFile(): Promise<{ name: string, blob: string, file_type: AttachmentType } | null> {
        try {
            // Opens a dialog to the user choose a file and then gets it's value as base64 encoded string
            const base64Data: { name: string, blob: string, file_type: AttachmentType } = await invoke('encode_file_to_base64');
            return base64Data;
        } catch (error) {
            console.error('Error picking file:', error);
            return null;
        }
    }
}
