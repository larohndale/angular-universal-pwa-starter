import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { Validators, FormGroup, FormBuilder, FormControl } from '@angular/forms';

import { MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecaptchaComponent } from 'ng-recaptcha';

@Component({
    selector: 'app-link-email-and-password-to-account',
    templateUrl: 'link-email-and-password-to-account.component.html',
})
export class LinkEmailAndPasswordToAccountComponent implements OnInit, OnDestroy {
    form: FormGroup;
    destroy: Subject<any> = new Subject();
    @ViewChild('recaptcha') recaptcha: RecaptchaComponent;
    showPassword = false;

    constructor(public auth: AuthService, public router: Router, private snackbar: MatSnackBar, private fb: FormBuilder) {}

    ngOnInit() {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            recaptcha: [null, Validators.required],
        });

        this.auth.user$.pipe(takeUntil(this.destroy)).subscribe(user => {
            if (this.auth.isAuthenticatedUser(user) && user.authProviders.includes('emailAndPassword')) {
                this.router.navigate(['/account']);
            }
        });

        this.auth.additionalProviderError$.pipe(takeUntil(this.destroy)).subscribe(error => {
            if (error === null) {
            } else if (error.error === 'Password Invalid') {
                this.auth.additionalProviderErrorHandled();
                this.form.patchValue({ password: '' });
                this.recaptcha.reset();
                this.snackbar.open(`Your password is invalid`, `OK`, {
                    duration: 5000,
                });
            } else if (Array.isArray(error.error)) {
                // password validation errors.
                this.auth.additionalProviderErrorHandled();
                this.form.patchValue({ password: '' });
                this.recaptcha.reset();
                switch (error.error[0]) {
                    case 'min':
                        return this.snackbar.open(`Password is too short`, `OK`, {
                            duration: 5000,
                        });

                    case 'oneOf':
                        return this.snackbar.open(`Pick a better password`, `OK`, {
                            duration: 5000,
                        });
                }
            }
        });
    }

    linkEmailAndPasswordToAccount() {
        const formValue = this.form.value;
        this.auth.linkProviderToAccount({
            email: formValue.email,
            password: formValue.password,
            provider: 'emailAndPassword',
        });
    }

    toggleShowPassword() {
        this.showPassword = !this.showPassword;
    }

    ngOnDestroy() {
        this.destroy.next();
    }
}
