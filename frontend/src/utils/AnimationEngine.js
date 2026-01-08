import anime from 'animejs';

/**
 * AnimationEngine - A singleton-like utility to manage visualization timelines.
 */
class AnimationEngine {
    constructor() {
        this.timeline = null;
        this.isPlaying = false;
        this.speed = 1.0;
    }

    createTimeline(completeCallback) {
        if (this.timeline) {
            this.timeline.pause();
        }
        this.timeline = anime.timeline({
            easing: 'easeOutCubic',
            duration: 800,
            autoplay: false,
            complete: () => {
                if (completeCallback) completeCallback();
            }
        });
        return this.timeline;
    }

    add(config, offset = '-=600') {
        if (!this.timeline) return;
        this.timeline.add(config, offset);
    }

    play() {
        if (this.timeline) {
            this.timeline.play();
            this.isPlaying = true;
        }
    }

    pause() {
        if (this.timeline) {
            this.timeline.pause();
            this.isPlaying = false;
        }
    }

    seek(percent) {
        if (this.timeline) {
            this.timeline.seek(this.timeline.duration * (percent / 100));
        }
    }

    reset() {
        if (this.timeline) {
            this.timeline.pause();
            this.timeline = null;
        }
        this.isPlaying = false;
    }
}

export const animationEngine = new AnimationEngine();
