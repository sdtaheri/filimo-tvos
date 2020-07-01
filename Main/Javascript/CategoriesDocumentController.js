class CategoriesDocumentController extends DocumentController {

    setupDocument(document) {
        super.setupDocument(document);

        let section = document.getElementsByTagName("section").item(0);
        section.dataItem = new DataItem();

        this.dataLoader.fetchCategoriesList((result) => {
           section.dataItem.setPropertyPath("categories", result.dataItems);
        });
    }
}

registerAttributeName("categoriesDocumentURL", CategoriesDocumentController);
