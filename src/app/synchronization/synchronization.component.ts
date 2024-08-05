import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { invoke } from '@tauri-apps/api/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputOtpModule } from 'primeng/inputotp';

import { OtpGeneratorService } from '../services/otp-generator.service';
import { BackupService } from '../services/backup.service';
import { AES } from 'crypto-js';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-synchronization',
    standalone: true,
    imports: [
        DialogModule,
        TranslateModule,
        ButtonModule,
        CommonModule,
        ReactiveFormsModule,
        InputOtpModule,
    ],
    providers: [],
    templateUrl: './synchronization.component.html',
    styleUrl: './synchronization.component.scss'
})
export class SynchronizationComponent {
    getFromOthersVisible = false;
    sendToOthersVisible = false;

    otpData!: string;
    serverIp!: string;

    enableDiscoverButton = true;
    showOTPField = false;

    fb = new FormBuilder();
    otpForm = this.fb.group({
        otp: ["", Validators.minLength(6)]
    });

    constructor(
        private otpGenerator: OtpGeneratorService,
        private backupService: BackupService,
        private httpClient: HttpClient,
        private messageService: MessageService,
        private translateService: TranslateService,
    ) {}

    openFromOthers() {
        this.getFromOthersVisible = true;
        this.sendToOthersVisible = false;
    }

    openToOthers() {
        this.sendToOthersVisible = true;
        this.getFromOthersVisible = false;
    }

    makeDeviceDiscoverable() {
        // generates OTP code
        let otp = this.otpGenerator.generateOTP();
        this.otpData = otp;
        console.log("OTP Data: ", otp);
        this.backupService.backupData(otp).subscribe(cryptedBackup => {
            console.log("Data backed up. broadcasting...");
            invoke('broadcast_network_sync_services').then(() => {
                console.log("Service broadcasted. Starting http server...");
                invoke('start_http_server', { otp_code: otp, backup_data: cryptedBackup });
            });
        });
    }

    discoverDevices() {
        this.enableDiscoverButton = false;
        this.showOTPField = true;
        console.log("Starting to discover devices...");
        // get devices with faire opened in the network
        invoke('search_network_sync_services').then(ipv4 => {
            console.log("Encountered the app in the machine with ip ", ipv4);
            this.showOTPField = true;
            this.serverIp = ipv4 as string;
        });
    }

    sendEncryptedOTP(event: Event) {
        console.log("Sending encripted data. OTP: ", this.otpForm.value.otp);
        const otp = this.otpForm.value.otp as unknown as string;
        
        // encrypts the otp and sends to the server 
        let encryptedOtp = AES.encrypt(otp , otp);

        this.httpClient.post<string>(`http://${this.serverIp}:9099/handshake`, {}, {
            headers: {
                'X-SIGNED-TOKEN': encryptedOtp.toString()
            }
        }).subscribe(backupData => {
            console.log("Data sent and backup received. Restoring backup...")
            this.backupService.restoreBackup(backupData, this.otpData).subscribe({
                complete: async () => {
                    console.log("Backup restored. Showing messages");
                    this.messageService.add({
                        summary: await firstValueFrom(this.translateService.get("Synchronized successfully")),
                        detail: await firstValueFrom(this.translateService.get("Your data was synchronized successfully.")),
                        severity: "success",
                        life: 4000,
                    });
                    await this.httpClient.post(`http://${this.serverIp}:9099/disconnect`, {});
                },
                error: async (err) => {
                    console.log("Error recovering backup. Showing messages...", err);
                    this.messageService.add({
                        summary: await firstValueFrom(this.translateService.get("Error synchronizing")),
                        detail: await firstValueFrom(this.translateService.get(`Error trying to synchronize data: `)) + err.toString()
                    });
                }
            });
        });
    }
}
