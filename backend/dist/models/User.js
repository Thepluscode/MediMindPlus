"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
let User = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('users')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _isEmailVerified_decorators;
    let _isEmailVerified_initializers = [];
    let _isEmailVerified_extraInitializers = [];
    let _verificationToken_decorators;
    let _verificationToken_initializers = [];
    let _verificationToken_extraInitializers = [];
    let _passwordResetToken_decorators;
    let _passwordResetToken_initializers = [];
    let _passwordResetToken_extraInitializers = [];
    let _passwordResetExpires_decorators;
    let _passwordResetExpires_initializers = [];
    let _passwordResetExpires_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    var User = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.email = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
            this.firstName = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _firstName_initializers, void 0));
            this.lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
            this.isEmailVerified = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _isEmailVerified_initializers, void 0));
            this.verificationToken = (__runInitializers(this, _isEmailVerified_extraInitializers), __runInitializers(this, _verificationToken_initializers, void 0));
            this.passwordResetToken = (__runInitializers(this, _verificationToken_extraInitializers), __runInitializers(this, _passwordResetToken_initializers, void 0));
            this.passwordResetExpires = (__runInitializers(this, _passwordResetToken_extraInitializers), __runInitializers(this, _passwordResetExpires_initializers, void 0));
            this.createdAt = (__runInitializers(this, _passwordResetExpires_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            // Add any additional fields as needed
            this.metadata = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            __runInitializers(this, _metadata_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "User");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _email_decorators = [(0, typeorm_1.Column)({ unique: true }), (0, class_validator_1.IsEmail)()];
        _password_decorators = [(0, typeorm_1.Column)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MinLength)(8)];
        _firstName_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _lastName_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _isEmailVerified_decorators = [(0, typeorm_1.Column)({ default: false })];
        _verificationToken_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _passwordResetToken_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _passwordResetExpires_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'jsonb', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
        __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
        __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
        __esDecorate(null, null, _isEmailVerified_decorators, { kind: "field", name: "isEmailVerified", static: false, private: false, access: { has: obj => "isEmailVerified" in obj, get: obj => obj.isEmailVerified, set: (obj, value) => { obj.isEmailVerified = value; } }, metadata: _metadata }, _isEmailVerified_initializers, _isEmailVerified_extraInitializers);
        __esDecorate(null, null, _verificationToken_decorators, { kind: "field", name: "verificationToken", static: false, private: false, access: { has: obj => "verificationToken" in obj, get: obj => obj.verificationToken, set: (obj, value) => { obj.verificationToken = value; } }, metadata: _metadata }, _verificationToken_initializers, _verificationToken_extraInitializers);
        __esDecorate(null, null, _passwordResetToken_decorators, { kind: "field", name: "passwordResetToken", static: false, private: false, access: { has: obj => "passwordResetToken" in obj, get: obj => obj.passwordResetToken, set: (obj, value) => { obj.passwordResetToken = value; } }, metadata: _metadata }, _passwordResetToken_initializers, _passwordResetToken_extraInitializers);
        __esDecorate(null, null, _passwordResetExpires_decorators, { kind: "field", name: "passwordResetExpires", static: false, private: false, access: { has: obj => "passwordResetExpires" in obj, get: obj => obj.passwordResetExpires, set: (obj, value) => { obj.passwordResetExpires = value; } }, metadata: _metadata }, _passwordResetExpires_initializers, _passwordResetExpires_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
})();
exports.User = User;
