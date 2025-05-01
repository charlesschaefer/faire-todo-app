import { Directive, ElementRef } from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';

type Timer = ReturnType<typeof setTimeout>;

type TapEvent = MouseEvent | PointerEvent | TouchEvent;

interface Point { x: number, y: number }

@Directive({
    selector: '[appNgxCdkDnDScrollFixer]',
    standalone: true
})
export class NgxCdkDnDScrollFixerDirective {

    private startMouseY = -1;
    private startX = -1;
    private updatedY = -1;
    private startTime = 0;
    private timeoutDuration = 400; // milliseconds
    private timeoutId?: Timer;
    private currentAction = '';
    private ticking = false;
    private dragging = false;
    private startScrollY = 0;
    private lastDistances = new Map<number, number>();
    private speed!: number;
    private acceleration!: number;
    private lastScrollTime!: number;
    private stopScrollDuration = 100;
    private keepScroll = false;
    private keepScrollAnimationFrameId!: number;
    private scrollFinished$ = new Subject<any>();
    private scrollFinishedSubscription!: Subscription;

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
            .subscribe(() => {
                this.pointerUp();
            });
        
        (el.nativeElement as HTMLElement).addEventListener('contextmenu', ev => ev.preventDefault());


    }

    pointerDown(ev: TapEvent) {
        this.keepScroll = false;
        if (this.keepScrollAnimationFrameId) {
            window.cancelAnimationFrame(this.keepScrollAnimationFrameId);
        }

        if (this.scrollFinishedSubscription) {
            this.scrollFinished$.unsubscribe();
            // creates a new Observable, since after the unsubscriprion it becames useless.
            this.scrollFinished$ = new Subject<any>();
        }

        const coords = this.getEventCoordinates(ev);
        const rect = (ev.target as HTMLElement).getBoundingClientRect();
        this.startX = rect.x;
        this.startMouseY = coords.y;
        this.startScrollY = window.scrollY;
        this.startTime = Date.now();
        this.timeoutId = setTimeout(() => {
            if (this.dragging) this.currentAction = 'dnd';
        }, this.timeoutDuration);
        this.dragging = true;
        
    }

    pointerMove(ev: TapEvent) {
        const coords = this.getEventCoordinates(ev);
        if (!this.dragging) return;
        if (this.currentAction == 'dnd') return;

        const timeoutExpired = Date.now() - this.startTime >= this.timeoutDuration;
        const xMoved = coords.x - this.startX;
        const yMoved = coords.y - this.startMouseY;


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

    pointerUp() {
        if (this.timeoutId) clearTimeout(this.timeoutId);

        if (this.dragging) {
            if (this.currentAction == 'scroll') {
                // we keep scrolling only if user kept holding the screen for some time (100ms)
                if (this.lastScrollTime && (Date.now() - this.lastScrollTime) < this.stopScrollDuration) {
                    this.keepScrolling();
                    return;
                }
            }
            this.clearUp();
        }
    }

    clearUp() {
        // Reset position
        this.dragging = false;
        this.startX = -1;
        this.startMouseY = -1;
        this.startScrollY = 0;
        this.currentAction = '';
        this.startTime = 0;
        this.lastScrollTime = 0;
        this.acceleration = 0;
        this.speed = 0;
        this.lastDistances = new Map();
        delete this.timeoutId;
    }

    updateScroll(ev: TapEvent) {
        const coords = this.getEventCoordinates(ev);

        const distance = (this.startMouseY - coords.y)
        this.updatedY = this.startScrollY + distance;
        this.lastScrollTime = Date.now();

        if (!this.ticking) {
            window.requestAnimationFrame(() => {
                const distance = window.scrollY - this.updatedY;
                const time = Date.now();
                this.saveDistance(distance, time);

                window.scroll({
                    top: this.updatedY,
                    left: this.startX
                });

                this.ticking = false;
                this.scrollFinished$.next(null);
            });

            this.ticking = true;
        }
    }

    keepScrolling() {
        this.scrollFinishedSubscription = this.scrollFinished$.subscribe(() => {
            if (!this.calculateAccelerationAndSpeed()) {
                this.clearUp();
                return;
            }
            this.keepScroll = true;
            this.continuedScroll()
        })
    }
    
    continuedScroll(callback?: () => void) {
        if (!this.keepScroll) {
            return;
        }
        const time = Date.now();
        // keep scrolling after the user left the element, calculating deacceleration
        this.keepScrollAnimationFrameId = window.requestAnimationFrame(() => {
            const elapsedTime = Date.now() - time;
            const scroll = elapsedTime * this.speed;
            const pos = window.scrollY - scroll;

            window.scroll({
                top: pos,
                left: this.startX
            });

            if (this.updateSpeed()) {
                // after updating the position, checks if the position was really updated. 
                // if not, it means we reached the end of the window and the scroll can stop
                this.continuedScroll(() => {
                    if ((scroll < 0 && window.scrollY < pos) || (scroll > 0 && window.scrollY > pos)) {
                    // if (window.scrollY <= 0 || (window.scrollY >= (document.body.scrollHeight - window.screen.availHeight))) {
                        this.keepScroll = false;
                    }
                });
            }
            if (callback) {
                callback();
            }
        });

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

    updateSpeed(): number {
        const priorSpeed = this.speed;
        if (this.acceleration) {
            this.speed -= (this.acceleration / 2);
        }
        if (this.speed < priorSpeed && this.speed < 0) {
            this.speed = 0
        } else if (this.speed > priorSpeed && this.speed > 0) {
            this.speed = 0;
        }
        
        return this.speed;
    }

    saveDistance(distance: number, time: number) {
        if (this.lastDistances.size == 10) {
            const first = this.lastDistances.keys().next().value;
            if (first) {
                this.lastDistances.delete(first)
            }
        }

        this.lastDistances.set(time, distance);
    }

    calculateAccelerationAndSpeed() {
        let lastTime = 0;
        const speeds = [];
        const times = [];

        if (this.lastDistances.size < 2) {
            return [];
        }

        for (const [time, distance] of this.lastDistances.entries()) {
            if (!lastTime) {
                lastTime = time;
                continue;
            }
            const timeDiff = time - lastTime
            // speed = Δdistance / Δtime;
            speeds.push(distance / timeDiff);
            times.push(timeDiff);
            lastTime = time;
        }
        // average speed of the last 3 distances
        this.speed = speeds.reduce((prev, curr) => prev + curr, 0) / speeds.length;
        const negative = this.speed < 0;
        const accelerations = [];
        for (let i = 1; i < speeds.length; i++) {
            let acceleration = (speeds[i] - speeds[i - 1]) / (Math.abs((times[i] - times[i - 1])) || 1);
            if (acceleration > 0 && negative || acceleration < 0 && !negative) {
                acceleration = -acceleration;
            }
            // acceleration = Δspeed/Δtime px/ms²
            accelerations.push(acceleration);
        }
        // average acceleration
        this.acceleration = accelerations.reduce((prev, curr) => prev + curr, 0) / accelerations.length;

        return [this.speed, this.acceleration];
    }
}
