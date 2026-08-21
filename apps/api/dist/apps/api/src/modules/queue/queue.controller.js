"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueController = void 0;
const common_1 = require("@nestjs/common");
const queue_service_1 = require("./queue.service");
const patients_service_1 = require("../patients/patients.service");
let QueueController = class QueueController {
    constructor(queue, patients) {
        this.queue = queue;
        this.patients = patients;
    }
    // POST /queue/check-in — reception check-in, or new-patient intake + check-in 
    checkIn(body) {
        let patientId = body.patientId; // if checking in an existing patient, this is already set
        if (!patientId && body.newPatient) {
            // no existing patientId, but new patient details were given, register them first
            patientId = this.patients.create(body.newPatient).id;
        }
        if (!patientId) {
            // neither an existing ID nor new patient details, can't proceed
            throw new Error("Either patientId or newPatient is required");
        }
        return this.queue.checkIn({
            patientId,
            facilityId: body.facilityId,
            servicePoint: body.servicePoint,
            source: body.source,
        });
    }
    // GET /queue/snapshot?facilityId=...&servicePoint=...  polled by reception/clinical/patient views.
    snapshot(facilityId, servicePoint) {
        return this.queue.snapshot(facilityId, servicePoint); // just delegates to the service method
    }
    // POST /queue/call-next, clinical staff pulls the next patient
    callNext(body) {
        return this.queue.callNext(body.facilityId, body.servicePoint);
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, common_1.Post)("check-in"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Get)("snapshot"),
    __param(0, (0, common_1.Query)("facilityId")),
    __param(1, (0, common_1.Query)("servicePoint")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "snapshot", null);
__decorate([
    (0, common_1.Post)("call-next"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "callNext", null);
exports.QueueController = QueueController = __decorate([
    (0, common_1.Controller)("queue"),
    __metadata("design:paramtypes", [queue_service_1.QueueService,
        patients_service_1.PatientsService])
], QueueController);
