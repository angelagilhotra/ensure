import {Asset} from './org.hyperledger.composer.system';
import {Participant} from './org.hyperledger.composer.system';
import {Transaction} from './org.hyperledger.composer.system';
import {Event} from './org.hyperledger.composer.system';
// export namespace org.example.ensure{
   export class Product extends Asset {
      productId: string;
      premium: number;
      cover: number;
      buyers: Patient[];
      provider: InsuranceProvider;
   }
   export class Patient extends Participant {
      email: string;
      firstName: string;
      lastName: string;
      balance: number;
      products: Product[];
   }
   export class InsuranceProvider extends Participant {
      email: string;
      name: string;
      products: Product[];
   }
   export class CreateProduct extends Transaction {
      productId: string;
      premium: number;
      cover: number;
      provider: InsuranceProvider;
   }
   export class BuyProduct extends Transaction {
      product: Product;
      patient: Patient;
   }
// }
