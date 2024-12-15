import { style } from '@angular/animations';
import { Directive, ElementRef } from '@angular/core';
import { add, remove } from 'dexie';
import { DateTime } from 'luxon';
import { concatAll, of, timer } from 'rxjs';
import { fromEvent, Observable } from 'rxjs';

type Timer = ReturnType<typeof setTimeout>;

type TapEvent = MouseEvent | PointerEvent | TouchEvent;

type Point = { x: number, y: number };

@Directive({
    selector: '[appNgxCdkDnDScrollFixer]',
    standalone: true
})
export class NgxCdkDnDScrollFixerDirective {

    private clickEventObserver!: Observable<TapEvent>;
    private moveEventObserver!: Observable<TapEvent>;
    private startY = -1;
    private startMouseY = -1;
    private startX = -1;
    private updatedX = -1;
    private updatedY = -1;
    private startTime = 0;
    private timeoutDuration = 400; // milliseconds
    private timeoutId?: Timer;
    private currentAction = '';
    private ticking = false;
    private dragging = false;
    private startScrollY = 0;


    constructor(private el: ElementRef) { 
        fromEvent<TapEvent>(el.nativeElement, 'touchstart', {capture: true})
            .subscribe((ev) => {
                    this.pointerDown(ev)
            });

        fromEvent<TapEvent>(el.nativeElement,'touchmove',{capture: true})
            .subscribe((ev) => {
                this.pointerMove(ev);
            });

        fromEvent<TapEvent>(el.nativeElement, 'touchend', { capture: true })
            .subscribe((ev) => {
                this.pointerUp(ev);
            });
        
        (el.nativeElement as HTMLElement).addEventListener('contextmenu', ev => ev.preventDefault());
    }

    pointerDown(ev: TapEvent) {
        const coords = this.getEventCoordinates(ev);
        const rect = (ev.target as HTMLElement).getBoundingClientRect();
        this.startX = rect.x;
        this.startY = rect.y;
        this.startMouseY = coords.y;
        this.startScrollY = window.scrollY;
        this.startTime = Date.now();
        this.timeoutId = setTimeout(() => {
            console.log("Passou o timeout. Vamos seguir sem scroll")
            if (this.dragging) this.currentAction = 'dnd';
        }, this.timeoutDuration);
        this.dragging = true;
        
    }

    pointerMove(ev: TapEvent) {
        console.log("Dragging? ", this.dragging, this.currentAction);
        const coords = this.getEventCoordinates(ev);
        if (!this.dragging) return;
        if (this.currentAction == 'dnd') return;

        const rect = (ev.target as Element).getBoundingClientRect();
        const timeoutExpired = Date.now() - this.startTime >= this.timeoutDuration;
        const xMoved = coords.x - this.startX;
        const yMoved = coords.y - this.startMouseY;

        console.error(`Movimento x: ${xMoved} - y: ${yMoved} => ${this.currentAction}`)

        // ainda não sabemos a intenção do usuário
        if (this.currentAction == '') {
            if (!timeoutExpired) {
                if (xMoved == 0 && yMoved == 0) {
                    // Ainda temos que esperar para saber sua intenção
                    return;
                } else {
                    this.currentAction = 'scroll';
                    clearTimeout(this.timeoutId);
                }
            } else {
                this.currentAction = 'dnd';
            }
        }

        if (this.currentAction == 'scroll') {
            this.updateScroll(ev);
        }
    }

    pointerUp(ev: TapEvent) {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.dragging) {
            // Reset position
            this.dragging = false;
            this.startX = -1;
            this.startY = -1;
            this.startMouseY = -1;
            this.startScrollY = 0;
            this.currentAction = '';
            this.startTime = 0;
            delete this.timeoutId;
        }
    }

    updateScroll(ev: TapEvent) {
        const coords = this.getEventCoordinates(ev);
        const rect = (ev.target as Element).getBoundingClientRect();

        this.updatedX = coords.x;
        // this.updatedY = (this.startY - (this.startMouseY));
        // this.updatedY = (coords.y - (this.startMouseY));
        this.updatedY = this.startScrollY + (this.startMouseY - coords.y);
        
        if (!this.ticking) {
            window.requestAnimationFrame(() => {
            // setTimeout(() => {
                const currentY = coords.y;
                window.scroll({
                    top: this.updatedY,
                    left: this.startX
                });

                this.ticking = false;
            });

            this.ticking = true;
        }
    }

    getEventCoordinates(event: TapEvent): Point {
        let x: number, y: number;
        if (event instanceof TouchEvent) {
            ({ clientX: x, clientY: y } = event.changedTouches[0]);
        } else {
            ({ clientX: x, clientY: y } = event);
        }
        return {x, y};
    }

}
