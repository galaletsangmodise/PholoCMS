"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let PatientsService = class PatientsService {
    constructor() {
        this.patients = new Map();
    }
    findById(id) {
        const patient = this.patients.get(id);
        if (!patient)
            throw new common_1.NotFoundException(`Patient ${id} not found`);
        return patient;
    }
    findByPhone(phoneNumber) {
        return [...this.patients.values()].find((p) => p.phoneNumber === phoneNumber);
    }
    search(query) {
        const q = query.toLowerCase();
        return [...this.patients.values()].filter((p) => p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            p.phoneNumber.includes(q) ||
            p.hprn?.toLowerCase() === q);
    }
    create(input) {
        const patient = {
            id: (0, crypto_1.randomUUID)(),
            hprn: null,
            allergies: [],
            chronicConditions: [],
            currentMedications: [],
            createdAt: new Date().toISOString(),
            ...input,
        };
        this.patients.set(patient.id, patient);
        return patient;
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)()
], PatientsService);
