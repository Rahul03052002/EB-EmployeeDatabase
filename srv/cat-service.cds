using my.company as my from '../db/schema';

service CatalogService {
   entity Employees as projection on my.Employees;
}
