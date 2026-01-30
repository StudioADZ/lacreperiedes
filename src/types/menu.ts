export type MenuItem = {
  name: string;
  description: string;
  price: string;
  image_url?: string;
};

export type CartePublicData = {
  galette_items: MenuItem[];
  crepe_items: MenuItem[];
};

export type SecretMenuPublicData = {
  menu_name: string;
  galette_special: string | null;
  galette_special_description: string | null;
  galette_special_price: string | null;
  galette_special_image_url: string | null;
  galette_special_video_url: string | null;

  crepe_special: string | null;
  crepe_special_description: string | null;
  crepe_special_price: string | null;
  crepe_special_image_url: string | null;
  crepe_special_video_url: string | null;

  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean | null;
};
