/**
 * =============================================================================
 * DENSPARK STUDIO — Answer Engine Optimization (AEO)
 * Helps AI engines (ChatGPT, Perplexity, Google AI) understand your content
 *
 * v2 changes:
 *  - All schemas now share a stable @id graph so Organization / LocalBusiness /
 *    WebSite / page schemas are linked as ONE entity, not restated separately.
 *  - Re-injection now works on client-side route changes (SPA-safe), not just
 *    on first DOMContentLoaded.
 *  - Removed fabricated VideoObject.uploadDate (was a hardcoded placeholder).
 *  - Each schema is generated/injected inside its own try/catch so one bad
 *    schema can't silently kill the rest.
 * =============================================================================
 */

(function() {
    'use strict';

    // =========================================================================
    //  CONFIGURATION
    // =========================================================================

    const AEO_CONFIG = {
        businessName: 'Denspark Studio',
        businessDescription: 'Professional Photography & Creative Media Studio in Machakos, Kenya',
        phone: '+254710468300',
        email: 'densparkstudio@gmail.com',
        address: 'Machakos Town, Machakos County, Kenya',
        priceRange: 'KSh',
        currency: 'KES',
        areaServed: 'Machakos, Kenya',
        foundingDate: '2016',
        services: [
            'Studio Portrait Photography',
            'Wedding Photography',
            'Event Photography',
            'Video Production',
            'Drone Services',
            'Graphic Design',
            'Branding',
            'Printing',
            'Live Streaming',
            'Social Media Management',
            'Commercial Photography',
            'Photo Editing'
        ],
        socialProfiles: [
            'https://www.facebook.com/share/1BK8dk8VsJ/',
            'https://www.instagram.com/densparkstudio',
            'https://youtube.com/@densparkfilmsmachakos6509',
            'https://www.tiktok.com/@densparkstudio300'
        ],
        openingHours: {
            'Monday': '08:30-20:00',
            'Tuesday': '08:30-20:00',
            'Wednesday': '08:30-20:00',
            'Thursday': '08:30-20:00',
            'Friday': '09:00-20:00',
            'Saturday': '08:30-20:00',
            'Sunday': '08:00-20:00'
        }
    };

    // =========================================================================
    //  STABLE ENTITY IDs
    //  These anchor every schema to the SAME business entity instead of each
    //  page restating Organization/LocalBusiness info as if it were separate.
    // =========================================================================

    function getEntityIds() {
        const origin = window.location.origin;
        return {
            business: origin + '/#business',   // canonical business entity
            website: origin + '/#website',
            logo: origin + '/#logo'
        };
    }

    // =========================================================================
    //  FAQ DATA
    // =========================================================================

    const FAQ_DATA = [
        {
            question: 'What photography services does Denspark Studio offer?',
            answer: 'Denspark Studio offers professional photography, videography, drone services, graphic design, branding, printing, live streaming, and social media management in Machakos, Kenya.'
        },
        {
            question: 'Where is Denspark Studio located?',
            answer: 'Denspark Studio is located in Machakos Town, Machakos County, Kenya. We serve clients across the Machakos region and surrounding areas.'
        },
        {
            question: 'How much do photography services cost at Denspark Studio?',
            answer: 'Denspark Studio offers affordable photography and videography packages. Contact us at +254 710 468 300 or visit our packages page for detailed pricing information.'
        },
        {
            question: 'Does Denspark Studio do wedding photography?',
            answer: 'Yes, Denspark Studio specializes in wedding photography and videography coverage in Machakos and across Kenya. We capture every special moment of your big day.'
        },
        {
            question: 'What are the business hours of Denspark Studio?',
            answer: 'Denspark Studio is open Monday to Thursday 8:30 AM – 8:00 PM, Friday 9:00 AM – 8:00 PM, Saturday 8:30 AM – 8:00 PM, and Sunday 8:00 AM – 8:00 PM.'
        },
        {
            question: 'Does Denspark Studio offer drone photography?',
            answer: 'Yes, Denspark Studio offers professional 4K drone photography and videography services for weddings, events, real estate, and commercial projects.'
        },
        {
            question: 'Can I book Denspark Studio for event photography?',
            answer: 'Absolutely! Denspark Studio provides complete event photography and videography coverage for birthdays, graduations, corporate events, and all types of celebrations.'
        },
        {
            question: 'What is the best photography studio in Machakos?',
            answer: 'Denspark Studio is widely regarded as one of the premier photography studios in Machakos, Kenya, offering professional services with modern equipment and creative direction.'
        },
        {
            question: 'Does Denspark Studio do video production?',
            answer: 'Yes, Denspark Studio offers full-service video production including filming, editing, color grading, sound design, and motion graphics for weddings, events, commercials, and corporate videos.'
        },
        {
            question: 'What printing services does Denspark Studio offer?',
            answer: 'Denspark Studio offers professional printing services including photo prints, frames, albums, banners, posters, and branded merchandise with premium finish quality.'
        }
    ];

    // =========================================================================
    //  PAGE DETECTION
    // =========================================================================

    function getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '') return 'home';
        if (path.includes('/about')) return 'about';
        if (path.includes('/contact')) return 'contact';
        if (path.includes('/services')) return 'services';
        if (path.includes('/portfolio')) return 'portfolio';
        if (path.includes('/packages')) return 'packages';
        if (path.includes('/videos') || path.includes('/video')) return 'videos';
        if (path.includes('/what_we_do')) return 'what_we_do';
        return 'other';
    }

    // =========================================================================
    //  SCHEMA GENERATORS
    //  Organization / LocalBusiness / WebSite now share @id references instead
    //  of each restating the full business record. Page-specific schemas point
    //  back at the business @id via mainEntity/provider/publisher references.
    // =========================================================================

    function generateOrganizationSchema(ids) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': ids.business,
            'name': AEO_CONFIG.businessName,
            'description': AEO_CONFIG.businessDescription,
            'url': window.location.origin,
            'logo': {
                '@type': 'ImageObject',
                '@id': ids.logo,
                'url': window.location.origin + '/static/imagies/denspark-logo.webp'
            },
            'image': { '@id': ids.logo },
            'foundingDate': AEO_CONFIG.foundingDate,
            'email': AEO_CONFIG.email,
            'telephone': AEO_CONFIG.phone,
            'priceRange': AEO_CONFIG.priceRange,
            'address': {
                '@type': 'PostalAddress',
                'addressLocality': 'Machakos',
                'addressRegion': 'Machakos County',
                'addressCountry': 'KE'
            },
            'sameAs': AEO_CONFIG.socialProfiles
        };
    }

    function generateLocalBusinessSchema(ids) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const hoursSpec = days.map(day => ({
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': day,
            'opens': AEO_CONFIG.openingHours[day].split('-')[0],
            'closes': AEO_CONFIG.openingHours[day].split('-')[1]
        }));

        // Same @id as Organization: this is the SAME entity, described with
        // LocalBusiness-specific fields (geo, hours, offer catalog) layered on.
        return {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': ids.business,
            'name': AEO_CONFIG.businessName,
            'description': AEO_CONFIG.businessDescription,
            'url': window.location.origin,
            'telephone': AEO_CONFIG.phone,
            'email': AEO_CONFIG.email,
            'image': window.location.origin + '/static/imagies/og-cover.webp',
            'priceRange': AEO_CONFIG.priceRange,
            'address': {
                '@type': 'PostalAddress',
                'addressLocality': 'Machakos',
                'addressRegion': 'Machakos County',
                'addressCountry': 'KE'
            },
            'geo': {
                '@type': 'GeoCoordinates',
                'latitude': -1.5177,
                'longitude': 37.2634
            },
            'openingHoursSpecification': hoursSpec,
            'sameAs': AEO_CONFIG.socialProfiles,
            'hasOfferCatalog': {
                '@type': 'OfferCatalog',
                'name': 'Photography and Creative Services',
                'itemListElement': AEO_CONFIG.services.map((service, index) => ({
                    '@type': 'Offer',
                    'itemOffered': {
                        '@type': 'Service',
                        'name': service
                    },
                    'position': index + 1
                }))
            }
        };
    }

    function generateBreadcrumbSchema() {
        const path = window.location.pathname;
        const parts = path.split('/').filter(p => p && p !== '');

        const items = [{
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': window.location.origin + '/'
        }];

        let currentPath = '';
        parts.forEach((part, index) => {
            currentPath += '/' + part;
            const name = part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            items.push({
                '@type': 'ListItem',
                'position': index + 2,
                'name': name,
                'item': window.location.origin + currentPath
            });
        });

        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': items
        };
    }

    function generateWebSiteSchema(ids) {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': ids.website,
            'name': AEO_CONFIG.businessName,
            'url': window.location.origin,
            'description': AEO_CONFIG.businessDescription,
            'publisher': { '@id': ids.business },
            'potentialAction': {
                '@type': 'SearchAction',
                'target': window.location.origin + '/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
            }
        };
    }

    function generateServiceSchema(ids) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Service',
            'serviceType': 'Photography and Creative Media Services',
            'provider': { '@id': ids.business },
            'areaServed': {
                '@type': 'Place',
                'name': AEO_CONFIG.areaServed
            },
            'hasOfferCatalog': {
                '@type': 'OfferCatalog',
                'name': 'Photography Services',
                'itemListElement': AEO_CONFIG.services.map((service, index) => ({
                    '@type': 'Offer',
                    'itemOffered': {
                        '@type': 'Service',
                        'name': service
                    },
                    'position': index + 1
                }))
            }
        };
    }

    function generateFAQSchema() {
        return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': FAQ_DATA.map(faq => ({
                '@type': 'Question',
                'name': faq.question,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': faq.answer
                }
            }))
        };
    }

    // =========================================================================
    //  PAGE-SPECIFIC SCHEMAS
    // =========================================================================

    function generateAboutPageSchema(ids) {
        return {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            'name': 'About Denspark Studio',
            'description': 'Learn about Denspark Studio, the premier photography and creative media studio in Machakos, Kenya.',
            'url': window.location.href,
            'mainEntity': { '@id': ids.business }
        };
    }

    function generateContactPageSchema(ids) {
        return {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            'name': 'Contact Denspark Studio',
            'description': 'Get in touch with Denspark Studio to book a photography session or inquire about our services.',
            'url': window.location.href,
            'mainEntity': { '@id': ids.business }
        };
    }

    function generatePortfolioSchema() {
        return {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            'name': 'Denspark Studio Portfolio',
            'description': 'Browse our photography and creative media portfolio showcasing our best work.',
            'url': window.location.href,
            'about': {
                '@type': 'Service',
                'name': 'Photography Services'
            }
        };
    }

    function generatePackagesSchema(ids) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Product',
            'name': 'Photography Packages - Denspark Studio',
            'description': 'Professional photography and videography packages in Machakos, Kenya.',
            'brand': { '@id': ids.business },
            'offers': {
                '@type': 'AggregateOffer',
                'priceCurrency': AEO_CONFIG.currency,
                'availability': 'https://schema.org/InStock',
                'url': window.location.href
            }
        };
    }

    function generateVideoSchema(ids) {
        // NOTE: uploadDate removed — schema.org expects a real date and this
        // was previously hardcoded to '2024-01-01'. Set a genuine value per
        // video before re-adding this field, otherwise leave it out.
        return {
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            'name': 'Denspark Studio Video Production',
            'description': 'Professional video production services including filming, editing, and post-production.',
            'thumbnailUrl': window.location.origin + '/static/imagies/video.jpg',
            'contentUrl': window.location.origin + '/videos',
            'embedUrl': window.location.origin + '/videos',
            'publisher': { '@id': ids.business }
        };
    }

    // =========================================================================
    //  SCHEMA INJECTOR
    // =========================================================================

    function injectSchema(schema, type) {
        try {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(schema, null, 2);
            script.id = 'aeo-schema-' + type;

            const existing = document.getElementById('aeo-schema-' + type);
            if (existing) existing.remove();

            document.head.appendChild(script);
        } catch (err) {
            // A bad schema (e.g. circular reference, serialization failure)
            // should not stop the rest of the schemas from injecting.
            console.error('[AEO] Failed to inject schema "' + type + '":', err);
        }
    }

    function removeAllSchemas() {
        document.querySelectorAll('[id^="aeo-schema-"]').forEach(el => el.remove());
        const marker = document.querySelector('[data-aeo-injected]');
        if (marker) marker.remove();
    }

    function injectAllSchemas() {
        const ids = getEntityIds();
        const page = getCurrentPage();
        console.log('[AEO] Current page:', page);

        // Common schemas (injected on all pages), all linked via @id
        injectSchema(generateOrganizationSchema(ids), 'organization');
        injectSchema(generateLocalBusinessSchema(ids), 'localbusiness');
        injectSchema(generateBreadcrumbSchema(), 'breadcrumb');
        injectSchema(generateWebSiteSchema(ids), 'website');

        // Page-specific schemas
        switch (page) {
            case 'home':
                injectSchema(generateFAQSchema(), 'faq');
                injectSchema(generateServiceSchema(ids), 'service');
                break;
            case 'about':
                injectSchema(generateAboutPageSchema(ids), 'aboutpage');
                break;
            case 'contact':
                injectSchema(generateContactPageSchema(ids), 'contactpage');
                break;
            case 'services':
                injectSchema(generateServiceSchema(ids), 'service');
                injectSchema(generateFAQSchema(), 'faq');
                break;
            case 'portfolio':
                injectSchema(generatePortfolioSchema(), 'portfolio');
                break;
            case 'packages':
                injectSchema(generatePackagesSchema(ids), 'packages');
                break;
            case 'videos':
                injectSchema(generateVideoSchema(ids), 'video');
                break;
            case 'what_we_do':
                injectSchema(generateServiceSchema(ids), 'service');
                injectSchema(generateFAQSchema(), 'faq');
                break;
            default:
                console.log('[AEO] No page-specific schemas for:', page);
        }

        // Mark as injected for this URL
        const marker = document.createElement('meta');
        marker.setAttribute('data-aeo-injected', 'true');
        marker.setAttribute('data-aeo-path', window.location.pathname);
        document.head.appendChild(marker);

        console.log('[AEO] All schemas injected successfully!');
        console.log('[AEO] Page:', page);
        console.log('[AEO] FAQ items:', FAQ_DATA.length);
        console.log('[AEO] Services listed:', AEO_CONFIG.services.length);
    }

    function reinjectIfPathChanged() {
        const marker = document.querySelector('[data-aeo-injected]');
        const lastPath = marker ? marker.getAttribute('data-aeo-path') : null;
        if (lastPath !== window.location.pathname) {
            removeAllSchemas();
            injectAllSchemas();
        }
    }

    // =========================================================================
    //  SPA ROUTE-CHANGE DETECTION
    //  Breadcrumb/page-specific schemas go stale on client-side navigation
    //  (pushState/replaceState/popstate) unless we watch for path changes.
    // =========================================================================

    function patchHistoryForRouteChanges() {
        const wrap = (method) => {
            const original = history[method];
            history[method] = function() {
                const result = original.apply(this, arguments);
                window.dispatchEvent(new Event('aeo:locationchange'));
                return result;
            };
        };
        wrap('pushState');
        wrap('replaceState');
        window.addEventListener('popstate', () => {
            window.dispatchEvent(new Event('aeo:locationchange'));
        });
        window.addEventListener('aeo:locationchange', reinjectIfPathChanged);
    }

    // =========================================================================
    //  INITIALIZATION
    // =========================================================================

    function initAEO() {
        const start = () => {
            injectAllSchemas();
            patchHistoryForRouteChanges();
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start);
        } else {
            start();
        }
    }

    // =========================================================================
    //  EXPOSE FOR DEBUGGING
    // =========================================================================

    window.AEO = {
        config: AEO_CONFIG,
        faqs: FAQ_DATA,
        getCurrentPage: getCurrentPage,
        getEntityIds: getEntityIds,
        generateFAQSchema: generateFAQSchema,
        generateOrganizationSchema: () => generateOrganizationSchema(getEntityIds()),
        generateLocalBusinessSchema: () => generateLocalBusinessSchema(getEntityIds()),
        generateBreadcrumbSchema: generateBreadcrumbSchema,
        generateWebSiteSchema: () => generateWebSiteSchema(getEntityIds()),
        generateServiceSchema: () => generateServiceSchema(getEntityIds()),
        generateAboutPageSchema: () => generateAboutPageSchema(getEntityIds()),
        generateContactPageSchema: () => generateContactPageSchema(getEntityIds()),
        generatePortfolioSchema: generatePortfolioSchema,
        generatePackagesSchema: () => generatePackagesSchema(getEntityIds()),
        generateVideoSchema: () => generateVideoSchema(getEntityIds()),
        injectAllSchemas: injectAllSchemas,
        reload: function() {
            removeAllSchemas();
            injectAllSchemas();
        }
    };

    // Auto-initialize
    initAEO();

    console.log('[AEO] Answer Engine Optimization loaded. Use window.AEO for debugging.');
    console.log('[AEO] Services:', AEO_CONFIG.services.join(', '));

})();