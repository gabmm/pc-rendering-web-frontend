import * as THREE from 'three';

export class Trajectory {
    constructor(controls, telemetry, keyframes, speedMultiplier = 1.0, warmupDuration = 10.0) {
        this.controls = controls;
        this.telemetry = telemetry;
        this.keyframes = keyframes;
        this.nKeyframes = keyframes.length;
        this.speedMultiplier = speedMultiplier;
        this.warmupDuration = warmupDuration;
        this.warmupElapsed = 0;
        this.isWarmingUp = true;

        if (this.keyframes.length < 2) {
            console.error("[Trajectory] ERRO: Cálculo de trajetória exige no mínimo dois pontos");
        }

        this.segmentIndex = 0;
        this.elapsedTimeInSegment = 0;
        this.isActive = false;

        this._camPosA = new THREE.Vector3();
        this._camPosB = new THREE.Vector3();
        this._targetA = new THREE.Vector3();
        this._targetB = new THREE.Vector3();
        this._currCamPos = new THREE.Vector3();
        this._currTarget = new THREE.Vector3();

        this.segmentDurations = [];
        this.totalTrajectoryDuration = 0;
        /**
         * segmento 1: ponto A ao B
         * segmento 2: ponto B ao C
         * etc..
         */
        for (let i = 0; i < this.nKeyframes - 1; i++) {
            // tempo = distancia / velocidade

            let kfA = this.keyframes[i];
            let kfB = this.keyframes[i + 1];
            let speed = kfA.speed * this.speedMultiplier;

            this._setPositions(this._camPosA, kfA.camPos);
            this._setPositions(this._camPosB, kfB.camPos);
            this._setPositions(this._targetA, kfA.target);
            this._setPositions(this._targetB, kfB.target);

            const camDist = this._camPosA.distanceTo(this._camPosB);
            const tarDist = this._targetA.distanceTo(this._targetB);

            const dist = Math.max(camDist, tarDist);

            const duration = dist > 0 ? (dist / speed) : 0.001;
            this.totalTrajectoryDuration += duration;
            this.segmentDurations.push(duration);
        }

        telemetry.setTrajectoryConfig(this.segmentDurations, this.totalTrajectoryDuration, this.keyframes, this.speedMultiplier, this.warmupDuration, this.warmupDuration);

        this.start();
    }

    _setPositions(obj, pos) {
        obj.set(pos.x, pos.y, pos.z);
    }

    _setLookAt(obj, pos, tar) {
        obj.setLookAt(
            pos.x, pos.y, pos.z,
            tar.x, tar.y, tar.z,
            false
        );
    }

    start() {
        this.isActive = true;
        this.segmentIndex = 0;
        this.elapsedTimeInSegment = 0;
        this.controls.enabled = false;

        const firstFrame = this.keyframes[0];
        this._setLookAt(this.controls, firstFrame.camPos, firstFrame.target);

        if (this.telemetry && !this.telemetry.isRecording) {
            this.telemetry.startRecording();
        }

        console.log(`[Trajectory] Iniciando trajetória. Duração total: ${this.totalTrajectoryDuration} s`);
    }

    update(deltaTime) {
        if (!this.isActive) return;

        /**
         * tempo parado inicialmente de warmup
         */

        if (this.isWarmingUp) {
            this.warmupElapsed += deltaTime;

            if (this.warmupElapsed < this.warmupDuration) {
                return;
            }

            const leftoverDelta = this.warmupElapsed - this.warmupDuration;
            this.isWarmingUp = false;
            deltaTime = leftoverDelta;
        }

        this.elapsedTimeInSegment += deltaTime;

        /**
         * preciso saber em qual segmento está
         * e quanto tempo passou desde que entrou
         * no segmento atual
         */

        while (this.elapsedTimeInSegment >= this.segmentDurations[this.segmentIndex]) {
            this.elapsedTimeInSegment -= this.segmentDurations[this.segmentIndex];
            this.segmentIndex++;

            //condição de saída
            if (this.segmentIndex >= this.nKeyframes - 1) {
                this.finish(this.keyframes[this.nKeyframes - 1]);
                return;
            }
        }

        /**
         * agora preciso calcular em que fração da trajetória
         * eu estou
         */

        const currSegmentDur = this.segmentDurations[this.segmentIndex];
        const segFraction = this.elapsedTimeInSegment / currSegmentDur;

        const startPos = this.keyframes[this.segmentIndex];
        const endPos = this.keyframes[this.segmentIndex + 1];

        this._setPositions(this._camPosA, startPos.camPos);
        this._setPositions(this._camPosB, endPos.camPos);
        this._setPositions(this._targetA, startPos.target);
        this._setPositions(this._targetB, endPos.target);

        this._currCamPos.lerpVectors(this._camPosA, this._camPosB, segFraction);
        this._currTarget.lerpVectors(this._targetA, this._targetB, segFraction);

        this._setLookAt(this.controls, this._currCamPos, this._currTarget);
    }

    finish(lastKf) {
        this._setLookAt(this.controls, lastKf.camPos, lastKf.target);

        this.isActive = false;
        this.controls.enabled = true;

        if (this.telemetry && this.telemetry.isRecording) {
            this.telemetry.stopRecording();
        }

        console.log(`[Trajectory] Trajetória finalizada`);
    }

    abort() {
        this.isActive = false;
        this.isWarmingUp = false;

        if (this.controls) {
            this.controls.enabled = true;
        }

        console.log("[Trajectory] Trajetória abortada");
    }
}
