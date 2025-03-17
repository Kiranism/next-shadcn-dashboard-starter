import { IResponseBase } from './base.schema';

export interface IProductListResponse extends IResponseBase {
  total_products?: number;
  payload: IProduct[];
}

export interface IProductResponse extends IResponseBase {
  payload: IProduct;
}

export interface IProduct {
  id: string;
  is_active: number;
  created_by: any;
  created_user_name: string;
  updated_by: any;
  updated_user_name: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: any;
  productCode: string;
  regularPrice: string;
  discountPrice?: string;
  quantity: number;
  description: string;
  keyFeatures: string;
  stockAmount: number;
  holdAmount: number;
  soldAmount: number;
  thresholdAMount: number;
  thumbnail: string;
  gallery: any;
  specifications: any;
  category: ICategory;
  brand: IBrand;
  questions: IQuestion[];
  ratings: IRating[];
  productAttributes: IProductAttribute[];
}

export interface ICategory {
  id: string;
  is_active: number;
  created_by: any;
  created_user_name: string;
  updated_by: any;
  updated_user_name: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
}

export interface ICategoryResponse extends IResponseBase {
  payload: ICategory;
}

export interface ICategoryListResponse extends IResponseBase {
  payload: ICategory[];
}

export interface IBrand {
  id: string;
  is_active: number;
  created_by: any;
  created_user_name: string;
  updated_by: any;
  updated_user_name: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  categories?: ICategory[];

  category_ids?: string[];
}

export interface IBrandResponse extends IResponseBase {
  payload: IBrand;
}

export interface IBrandListResponse extends IResponseBase {
  payload: IBrand[];
}

export interface IQuestion {
  id: string;
  is_active: number;
  created_by: any;
  created_user_name: string;
  updated_by: any;
  updated_user_name: string;
  created_at: string;
  updated_at: string;
  question: string;
  answer: IAnswer[];
}

export interface IAnswer {
  id: string;
  is_active: number;
  created_by: any;
  created_user_name: string;
  updated_by: any;
  updated_user_name: string;
  created_at: string;
  updated_at: string;
  answer: string;
}

export interface IRating {
  id: string;
  is_active: number;
  created_by: any;
  created_user_name: string;
  updated_by: any;
  updated_user_name: string;
  created_at: string;
  updated_at: string;
  description: string;
  star_count: number;
}

export interface IProductAttribute {
  id: string;
  is_active: number;
  created_by: any;
  created_user_name: string;
  updated_by: any;
  updated_user_name: string;
  created_at: string;
  updated_at: string;
  attributeValue: IAttributeValue;
}

export interface IProductAttributeResponse extends IResponseBase {
  payload: IProductAttribute;
}

export interface IProductAttributeListResponse extends IResponseBase {
  payload: IProductAttribute[];
}

export interface IAttributeValue {
  id: string;
  is_active: number;
  created_by: string;
  created_user_name: string;
  updated_by: string;
  updated_user_name: string;
  created_at: string;
  updated_at: string;
  value: string;
  attributeGroup: IAttributeGroup;
}

export interface IAttributeValueResponse extends IResponseBase {
  payload: IAttributeValue;
}

export interface IAttributeValueListResponse extends IResponseBase {
  payload: IAttributeValue[];
}

export interface IAttributeGroup {
  id: string;
  is_active: number;
  created_by: string;
  created_user_name: string;
  updated_by: string;
  updated_user_name: string;
  created_at: string;
  updated_at: string;
  title: string;
}

export interface IAttributeGroupResponse extends IResponseBase {
  payload: IAttributeGroup;
}

export interface IAttributeGroupListResponse extends IResponseBase {
  payload: IAttributeGroup[];
}
