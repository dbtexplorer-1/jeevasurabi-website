// Define your number ONCE here
const basePhone = "+91 94436 08203"; 

export const siteConfig = {
  name: "JeevaSurabi",
  description: "Traditional wood-pressed oils for a healthier lifestyle. Retaining 100% natural soul through ancient extraction methods.",
  contact: {
    email: "jeevasurabifoodproducts7@gmail.com",
    phone: basePhone,
    address: "#318, Arunachalam Colony, Vadasery, Nagercoil – 629001",
  },
  links: {
    // Make sure to put your real social links here!
    instagram: "https://instagram.com/jeevasurabi",
    facebook: "https://facebook.com/jeevasurabi",
    twitter: "https://twitter.com/jeevasurabi",
    
    // 🔥 THE FIX: This dynamically creates "https://wa.me/919443608203"
    whatsapp: `https://wa.me/${basePhone.replace(/[^0-9]/g, '')}`,
  },
};

export type SiteConfig = typeof siteConfig;