import {body} from 'express-validator';

const addItemOrUpdateItemQuantityValidator = ()=>{
    return [
        body("quantity")
                 .optional()
                 .isInt({min:1})
                 .withMessage("Quantity must be a positive integer")
    ]
}

export {addItemOrUpdateItemQuantityValidator}