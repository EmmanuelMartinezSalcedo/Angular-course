import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Employee } from 'src/app/interfaces/employees.interface';
import { User } from 'src/app/interfaces/user.interface';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
@Component({
  selector: 'app-update-employee',
  templateUrl: './update-employee.component.html',
  styleUrls: ['./update-employee.component.scss'],
})
export class UpdateEmployeeComponent  implements OnInit {

  @Input() employee: Employee

  firebaseService = inject(FirebaseService)
  utilsService = inject(UtilsService)

  user = {} as User;

  form = new FormGroup({
    id: new FormControl(''),
    name: new FormControl('', [Validators.required]),
    img: new FormControl('', [Validators.required]),
    salary: new FormControl(null, [Validators.required, Validators.min(0)]),
    charge: new FormControl('', [Validators.required]),
    staff: new FormControl('', [Validators.required])
  })

  constructor() { }

  ngOnInit() {
    this.user = this.utilsService.getLocalStorage('user');
    if (this.employee) this.form.setValue(this.employee)
  }

  setNumberInput () {
    let { salary } = this.form.controls;
    if(salary.value) salary.setValue(parseFloat(salary.value))
  }

  async submit() {
    if (this.form.valid) {
      if (this.employee) this.updateEmployee();
      else this.createEmployee();
    }

  }

  async createEmployee() {

    let path = `users/${this.user.uid}/empleados`

    const loading = await this.utilsService.loading();
    await loading.present();

    let dataUrl = this.form.value.img;
    let imgPath = `${this.user.uid}/${Date.now()}`;
    let imgUrl = await this.firebaseService.updateImg(imgPath, dataUrl);

    this.form.controls.img.setValue(imgUrl);

    delete this.form.value.id;

    this.firebaseService.addDocument(path, this.form.value)
    .then (async resp => {
      this.utilsService.dismissModal({ success: true });

      this.utilsService.presentToast({
        message: `Empleado creado exitosamente`,
        duration: 1500,
        color: 'primary',
        position: 'bottom',
        icon: 'checkmark-circle-outline'
      })

    }).catch(error => {
      console.log(error);
      this.utilsService.presentToast({
        message: error.mesaage,
        duration: 2500,
        color: 'danger',
        position: 'bottom',
        icon: 'alert-outline'
      })
    }).finally(() => {
      loading.dismiss()
    })
  }

  async updateEmployee() {
    let path = `users/${this.user.uid}/empleados/${this.employee.id}`

    const loading = await this.utilsService.loading();
    await loading.present();

    if(this.form.value.img !== this.employee.img) {
      let dataUrl = this.form.value.img;
      let imgPath = await this.firebaseService.getFilePath(this.employee.img);
      let imgUrl = await this.firebaseService.updateImg(imgPath, dataUrl);

      this.form.controls.img.setValue(imgUrl);
    }

    delete this.form.value.id;

    this.firebaseService.updateDocument(path, this.form.value)
    .then (async resp => {
      this.utilsService.dismissModal({ success: true });

      this.utilsService.presentToast({
        message: `Empleado actualizado exitosamente`,
        duration: 1500,
        color: 'primary',
        position: 'bottom',
        icon: 'checkmark-circle-outline'
      })

    }).catch(error => {
      console.log(error);
      this.utilsService.presentToast({
        message: error.mesaage,
        duration: 2500,
        color: 'danger',
        position: 'bottom',
        icon: 'alert-outline'
      })
    }).finally(() => {
      loading.dismiss()
    })
  }

  async takeImage() {
    const dataUrl = (await this.utilsService.takePicture('Imagen del empleado')).dataUrl
    this.form.controls.img.setValue(dataUrl);
  }

}
