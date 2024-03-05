import { Component, OnInit, inject } from '@angular/core';
import { map} from 'rxjs';
import { Employee } from 'src/app/interfaces/employees.interface';
import { User } from 'src/app/interfaces/user.interface';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { UpdateEmployeeComponent } from 'src/app/shared/components/update-employee/update-employee.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  utilsService = inject(UtilsService);
  firebaseService = inject(FirebaseService);

  loading: boolean = false;
  employees: Employee[] = [];

  constructor() { }

  ngOnInit() {
    // this.getEmployee()
  }

  ionViewWillEnter() {
    this.getEmployee();
  }
  async addUpdateEmployee(employee?: Employee) {
    let modal = await this.utilsService.getModal({
      component: UpdateEmployeeComponent,
      cssClass: 'add-update-modal',
      componentProps: { employee }
    })
    if ( modal ) this.getEmployee()
  }

  user(): User {
    return this.utilsService.getLocalStorage('user')
  }

  getEmployee() {
    let path = `users/${this.user().uid}/empleados`

    this.loading = true;

    let sub = this.firebaseService.getCollectionData(path)
    .snapshotChanges().pipe(
      map(changes => changes.map(c => ({
        id: c.payload.doc.id,
        ...c.payload.doc.data()
      })))
    ).subscribe({
      next: (resp: any) => {
        this.employees = resp

        this.loading = false;
        sub.unsubscribe();
      }
    })
  }

  doRefresh(event: any) {
    setTimeout(() => {
      this.getEmployee()
      event.target.complete
    }, 1000)
  }

  async deleteEmployee(employee: Employee) {
    let path = `users/${this.user().uid}/empleados/${employee.id}`

    const loading = await this.utilsService.loading();
    await loading.present();

    let imgPath = await this.firebaseService.getFilePath(employee.img);
    await this.firebaseService.deleteFile(imgPath);

    this.firebaseService.deleteDocument(path)
    .then (async resp => {

      this.employees = this.employees.filter(e => e.id !== employee.id);
      this.utilsService.dismissModal({ success: true });

      this.utilsService.presentToast({
        message: `Empleado eliminado exitosamente`,
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

  async confirmDeleteEmployee(employee: Employee) {
    this.utilsService.presentAlert({
      header: 'Eliminar empleado',
      message: '¿Desea eliminar el empleado?',
      mode: 'ios',
      buttons: [
        { text: 'Cancelar' },
        {
          text: 'Si, eliminar',
          handler: () => {
            this.deleteEmployee(employee);
          }
        }
      ]
    })
  }

  getBills() {
    return this.employees.reduce((index, employee) => index + employee.salary, 0);
  }

}
