// NOTE: For use in the TEST environment, this iid is currently available in Cedar
// Delivery Service. If it should fail, first verify that this iid is still there

import { jstor_types, status_options } from "@prisma/client";
import { basic_facility, basic_reviewer } from "../users/fixtures.js";

// in TEST.
export const iid = "06d158e4-d18e-3ba8-acd3-edea68f9f863";
export const iid_path = `/${iid}`;

export const cedar_identity_response = {
  issue_iid: ["a37ddab2-abda-340b-ab09-44a6906984a7"],
  issue_doi: ["10.2307/i23261497"],
  issn: ["01604341"],
  jcode: ["humjsocrel"],
  iid: ["0f2e71c7-1ce6-34d0-869b-fa2a879094f7"],
  oclc: ["646982769"],
  journal_doi: ["10.2307/j50004450"],
  journal_iid: ["adbd0d0e-7ff6-38d2-b36c-d6b5578ff4a5"],
  doi: ["10.2307/20452663"],
};

export const cedar_item_view_response = [
  {
    published_date: "SPRING/SUMMER 1974",
    thumbs: [
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/small/dtc.57.tif.jpg",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/small/dtc.58.tif.jpg",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/small/dtc.59.tif.jpg",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/small/dtc.60.tif.jpg",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/small/dtc.61.tif.jpg",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/small/dtc.62.tif.jpg",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/small/dtc.63.tif.jpg",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/small/dtc.64.tif.jpg",
    ],
    is_csp: "false",
    ref_block_2: [
      [
        {
          title: "NOTES",
        },
        {
          label: "1",
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r235 c273",
              page: "7",
              text: "Flexner, 1959",
              display_loc: [[3294, 3620, 3697, 3677]],
              pdf_loc: [[395.2, 394, 443.6, 387.2]],
            },
            {
              inscrutable_id: "10.2307/23261506 r235 c274",
              page: "7",
              text: "O'Neill, 1969a",
              display_loc: [[3740, 3620, 4159, 3677]],
              pdf_loc: [[448.8, 394, 499, 387.2]],
            },
            {
              inscrutable_id: "10.2307/23261506 r235 c275",
              page: "7",
              text: "Smith, 1970",
              display_loc: [
                [4200, 3620, 4391, 3677],
                [614, 3702, 753, 3751],
              ],
              pdf_loc: [
                [504, 394, 526.9, 387.2],
                [73.6, 384.2, 90.3, 378.3],
              ],
            },
            {
              inscrutable_id: "10.2307/23261506 r235 c276",
              page: "7",
              text: "Riegel, 1963.",
              display_loc: [[800, 3700, 1175, 3763]],
              pdf_loc: [[96, 384.4, 141, 376.9]],
            },
            {
              inscrutable_id: "10.2307/23261506 r235 c277",
              page: "7",
              text: "Reigel, 1970",
              display_loc: [[1454, 3700, 1813, 3761]],
              pdf_loc: [[174.4, 384.4, 217.5, 377.1]],
            },
            {
              inscrutable_id: "10.2307/23261506 r235 c278",
              page: "7",
              text: "Sinclair, 1965",
              display_loc: [[1978, 3698, 2381, 3757]],
              pdf_loc: [[237.3, 384.7, 285.7, 377.6]],
            },
          ],
        },
        {
          label: "2",
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r236 c279",
              page: "7",
              text: "Lasch, 1967:65-68",
              display_loc: [[1276, 4376, 1813, 4431]],
              pdf_loc: [[153.1, 303.3, 217.5, 296.7]],
            },
          ],
        },
        {
          label: "4",
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r237 c280",
              page: "7",
              text: "Drinnon, 1961",
              display_loc: [[2802, 4660, 3215, 4715]],
              pdf_loc: [[336.2, 269.2, 385.8, 262.6]],
            },
          ],
        },
        {
          label: "5",
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r238 c281",
              page: "7",
              text: "Millett. 1970:176-203",
              display_loc: [[750, 4890, 1393, 4943]],
              pdf_loc: [[90, 241.6, 167.1, 235.3]],
            },
          ],
        },
        {
          label: "6",
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r239 c282",
              page: "7",
              text: "Kennedy, 1970",
              display_loc: [[612, 4964, 1051, 5021]],
              pdf_loc: [[73.4, 232.7, 126.1, 225.9]],
            },
          ],
        },
        {
          label: "7",
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r240 c283",
              page: "7",
              text: "Goldman, 1910:243",
              display_loc: [[1530, 5260, 2117, 5317]],
              pdf_loc: [[183.6, 197.2, 254, 190.4]],
            },
          ],
        },
        {
          label: "8",
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r241 c284",
              page: "7",
              text: "Eastman, 1920:23",
              display_loc: [[2124, 5566, 2655, 5623]],
              pdf_loc: [[254.8, 160.5, 318.5, 153.7]],
            },
          ],
        },
        {
          label: "9",
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r242 c285",
              page: "7",
              text: "Hale, 1914:86",
              display_loc: [[1418, 5802, 1831, 5861]],
              pdf_loc: [[170.1, 132.2, 219.7, 125.1]],
            },
            {
              inscrutable_id: "10.2307/23261506 r242 c286",
              page: "7",
              text: "Eastman, 1920:23",
              display_loc: [[2442, 5954, 2973, 6011]],
              pdf_loc: [[293, 114, 356.7, 107.1]],
            },
          ],
        },
        {
          label: "11",
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r243 c287",
              page: "7",
              text: "Henrik Ibsen, A DOLL'S HOUSE, first published in 1879",
              display_loc: [[612, 6262, 2273, 6321]],
              pdf_loc: [[73.4, 77, 272.7, 69.9]],
            },
          ],
        },
      ],
      [
        {
          title: "REFERENCES",
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r244 c288",
              page: "8",
              text: "Anderson, Margaret C. 1930 MY THIRTY YEARS' WAR. New York: Covici, Friede.",
              display_loc: [
                [676, 742, 1325, 805],
                [780, 806, 2599, 867],
              ],
              pdf_loc: [
                [81.1, 739.4, 159, 731.8],
                [93.6, 731.7, 311.8, 724.4],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r245 c289",
              page: "8",
              text: "Drinnon, Richard. 1961 REBEL IN PARADISE: A BIOGRAPHY OF EMMA GOLDMAN. Chicago: University of Chicago Press.",
              display_loc: [
                [678, 874, 1199, 931],
                [778, 940, 3989, 1009],
              ],
              pdf_loc: [
                [81.3, 723.6, 143.8, 716.7],
                [93.3, 715.6, 478.6, 707.4],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r246 c290",
              page: "8",
              text: 'Eastman, Crystal. 1920 "Now we can begin." THE LIBERATOR III (December):23.',
              display_loc: [
                [678, 1010, 1181, 1067],
                [774, 1076, 2713, 1137],
              ],
              pdf_loc: [
                [81.3, 707.2, 141.7, 700.4],
                [92.8, 699.3, 325.5, 692],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r247 c291",
              page: "8",
              text: 'Eaton, Jeannette. 1915 "The woman\'s magazine." THE MASSES VII (October-November):19.',
              display_loc: [
                [676, 1144, 1179, 1199],
                [776, 1210, 3011, 1273],
              ],
              pdf_loc: [
                [81.1, 691.1, 141.4, 684.6],
                [93.1, 683.2, 361.3, 675.7],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r248 c292",
              page: "8",
              text: "Flexner, Eleanor. 1959 CENTURY OF STRUGGLE: THE WOMAN'S RIGHTS MOVEMENT IN THE UNITED STATES. Cambridge: Belknap Press of Harvard University Press.",
              display_loc: [
                [678, 1278, 1171, 1333],
                [776, 1344, 4685, 1411],
                [776, 1414, 1499, 1471],
              ],
              pdf_loc: [
                [81.3, 675.1, 140.5, 668.5],
                [93.1, 667.1, 562.1, 659.1],
                [93.1, 658.8, 179.8, 651.9],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r249 c293",
              page: "8",
              text: "Gilman, Charlotte Perkins. 1966 WOMEN AND ECONOMICS: A STUDY OF THE ECONOMIC RELATIONS BETWEEN MEN AND WOMEN AS A FACTOR IN SOCIAL EVOLUTION. Introduction by Carl Degler. Harper Torchbooks. New York: Harper & Row (Boston, 1898).",
              display_loc: [
                [674, 1480, 1443, 1537],
                [778, 1548, 4719, 1607],
                [772, 1614, 4215, 1681],
              ],
              pdf_loc: [
                [80.8, 650.8, 173.1, 644],
                [93.3, 642.7, 566.2, 635.6],
                [92.6, 634.8, 505.7, 626.7],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r250 c294",
              page: "8",
              text: "Goldman, Emma. 1910 ANARCHISM AND OTHER ESSAYS. New York: Mother Earth Publishing Association.",
              display_loc: [
                [674, 1682, 1179, 1739],
                [776, 1750, 3543, 1815],
              ],
              pdf_loc: [
                [80.8, 626.6, 141.4, 619.8],
                [93.1, 618.4, 425.1, 610.6],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r251 c295",
              page: "8",
              text: "1970 LIVING MY LIFE. 2 vols. New York: Da Capo Press (New York, 1931).",
              display_loc: [[778, 1818, 3079, 1879]],
              pdf_loc: [[93.3, 610.3, 369.4, 603]],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r252 c296",
              page: "8",
              text: "Hale, Beatrice Forbes-Robertson. 1914 WHAT WOMEN WANT: AN INTERPRETATION OF THE FEMINIST MOVEMENT. New York: Frederick A. Stokes Company.",
              display_loc: [
                [676, 1886, 1637, 1943],
                [776, 1954, 4733, 2025],
              ],
              pdf_loc: [
                [81.1, 602.1, 196.4, 595.3],
                [93.1, 594, 567.9, 585.4],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r253 c297",
              page: "8",
              text: "Kennedy, David M. 1970 BIRTH CONTROL IN AMERICA: THE CAREER OF MARGARET SANGER. New Haven: Yale University Press.",
              display_loc: [
                [680, 2022, 1229, 2079],
                [774, 2090, 4307, 2159],
              ],
              pdf_loc: [
                [81.6, 585.8, 147.4, 579],
                [92.8, 577.6, 516.8, 569.4],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r254 c298",
              page: "8",
              text: "Kraditor, Aileen S. 1965 THE IDEAS OF THE WOMAN SUFFRAGE MOVEMENT, 1890-1920. New York: Columbia University Press.",
              display_loc: [
                [678, 2158, 1215, 2213],
                [776, 2224, 4195, 2293],
              ],
              pdf_loc: [
                [81.3, 569.5, 145.7, 562.9],
                [93.1, 561.6, 503.4, 553.3],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r255 c299",
              page: "8",
              text: "Lasch, Christopher. 1967 THE NEW RADICALISM IN AMERICA, 1889-1963: THE INTELLECTUAL AS A SOCIAL TYPE. Vintage Books. New York: Random House (New York, 1965)",
              display_loc: [
                [676, 2294, 1233, 2355],
                [774, 2360, 4671, 2431],
                [774, 2430, 1771, 2489],
              ],
              pdf_loc: [
                [81.1, 553.1, 147.9, 545.8],
                [92.8, 545.2, 560.5, 536.7],
                [92.8, 536.8, 212.5, 529.8],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r256 c300",
              page: "8",
              text: "Mayreder, Rosa. 1913 A SURVEY OF THE WOMAN PROBLEM. Translated by Herman Scheffauer. New York: George H. Doran Company.",
              display_loc: [
                [672, 2500, 1139, 2555],
                [774, 2566, 4419, 2635],
              ],
              pdf_loc: [
                [80.6, 528.4, 136.6, 521.8],
                [92.8, 520.5, 530.2, 512.2],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r257 c301",
              page: "8",
              text: "Millett, Kate. 1970 SEXUAL POLITICS. Garden City, New York: Doubleday.",
              display_loc: [
                [672, 2634, 1049, 2689],
                [774, 2700, 2669, 2763],
              ],
              pdf_loc: [
                [80.6, 512.4, 125.8, 505.7],
                [92.8, 504.4, 320.2, 496.9],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r258 c302",
              page: "8",
              text: "O'Neill, William L. 1969a EVERYONE WAS BRAVE: THE RISE AND FALL OF FEMINISM IN AMERICA.Chicago: Quadrangle Books.",
              display_loc: [
                [670, 2768, 1207, 2823],
                [772, 2834, 4271, 2907],
              ],
              pdf_loc: [
                [80.3, 496.3, 144.8, 489.7],
                [92.6, 488.4, 512.5, 479.6],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r259 c303",
              page: "8",
              text: "1969b THE WOMAN MOVEMENT: FEMINISM IN THE UNITED STATES AND ENGLAND. London: George Allen and Unwin Ltd.",
              display_loc: [[774, 2902, 4721, 2971]],
              pdf_loc: [[92.8, 480.2, 566.5, 471.9]],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r260 c304",
              page: "8",
              text: 'Patterson, Ethel Lloyd. 1911 "Lena Morrow Lewis: Agitator." THE MASSES I (July): 13.',
              display_loc: [
                [670, 2970, 1343, 3029],
                [772, 3036, 2691, 3099],
              ],
              pdf_loc: [
                [80.3, 472, 161.1, 465],
                [92.6, 464.1, 322.9, 456.5],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r261 c305",
              page: "8",
              text: "Riegel, Robert E. 1963 AMERICAN FEMINISTS. Lawrence: University of Kansas Press.",
              display_loc: [
                [672, 3104, 1167, 3163],
                [772, 3170, 2849, 3231],
              ],
              pdf_loc: [
                [80.6, 456, 140, 448.9],
                [92.6, 448, 341.8, 440.7],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r262 c306",
              page: "8",
              text: "1970 AMERICAN WOMEN: A STORY OF SOCIAL CHANGE. Rutherford, New Jersey: Fairleigh Dickinson University Press.",
              display_loc: [[770, 3234, 4463, 3303]],
              pdf_loc: [[92.3, 440.4, 535.5, 432.1]],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r263 c307",
              page: "8",
              text: "Sanger, Margaret. 1938 MARGARET SANGER: AN AUTOBIOGRAPHY. New York: W. W. Norton & Company.",
              display_loc: [
                [668, 3302, 1167, 3363],
                [772, 3368, 3583, 3437],
              ],
              pdf_loc: [
                [80.1, 432.2, 140, 424.9],
                [92.6, 424.3, 429.9, 416],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r264 c308",
              page: "8",
              text: "Schreiner, Olive. 1911 WOMAN AND LABOR. New York: Frederick A. Stokes Company.",
              display_loc: [
                [668, 3438, 1143, 3493],
                [772, 3504, 2925, 3569],
              ],
              pdf_loc: [
                [80.1, 415.9, 137.1, 409.3],
                [92.6, 408, 351, 400.2],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r265 c309",
              page: "8",
              text: "Sinclair, Andrew. 1965 THE BETTER HALF: THE EMANCIPATION OF THE AMERICAN WOMAN. New York: Harper & Row.",
              display_loc: [
                [664, 3572, 1165, 3627],
                [770, 3638, 4075, 3705],
              ],
              pdf_loc: [
                [79.6, 399.8, 139.7, 393.2],
                [92.3, 391.9, 489, 383.8],
              ],
            },
          ],
        },
        {
          cites: [
            {
              inscrutable_id: "10.2307/23261506 r266 c310",
              page: "8",
              text: "Smith, Page. 1970 DAUGHTERS OF THE PROMISED LAND: WOMEN IN AMERICAN HISTORY. Boston: Little, Brown and Company.",
              display_loc: [
                [666, 3706, 1021, 3765],
                [770, 3772, 4463, 3841],
              ],
              pdf_loc: [
                [79.9, 383.7, 122.5, 376.6],
                [92.3, 375.8, 535.5, 367.5],
              ],
            },
          ],
        },
      ],
    ],
    pub_date_iso8601: "1974-04-01T00:00:00Z",
    pdf: "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/23261506.pdf",
    issue: "No. 2",
    page_sizes: [
      [795, 1029],
      [795, 1029],
      [795, 1029],
      [795, 1029],
      [795, 1029],
      [795, 1029],
      [795, 1029],
      [795, 1029],
    ],
    page_count: 8,
    journal: "Humboldt Journal of Social Relations",
    id: "0f2e71c7-1ce6-34d0-869b-fa2a879094f7",
    author: [
      {
        enhanced_display_format: ["GERALD L. MARRINER"],
        display_format: ["GERALD L. MARRINER"],
        surname: ["MARRINER"],
        "given-names": ["GERALD L."],
      },
    ],
    title:
      "THE FEMINIST REVOLT: THE EMERGENCE OF THE NEW WOMAN IN THE EARLY TWENTIETH CENTURY",
    items_citing_this: [],
    disc_code: ["sociology-discipline", "socialsciences-discipline"],
    year: "1974",
    discipline: ["Sociology", "Social Sciences"],
    content_type: "journal",
    time_stamp: 1467920450262,
    item_type: "article",
    available_formats: ["PDF", "Page Scan"],
    page_range: "pp. 127-134",
    src_info: "Vol. 1, No. 2 (SPRING/SUMMER 1974), pp. 127-134",
    page_names: ["127", "128", "129", "130", "131", "132", "133", "134"],
    page_images: [
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/pages/dtc.57.tif.gif",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/pages/dtc.58.tif.gif",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/pages/dtc.59.tif.gif",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/pages/dtc.60.tif.gif",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/pages/dtc.61.tif.gif",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/pages/dtc.62.tif.gif",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/pages/dtc.63.tif.gif",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/images/pages/dtc.64.tif.gif",
    ],
    issue_stable_url: "/stable/i23261497",
    build_info: "unavailable",
    first_page_has_illustration: "false",
    is_crossref_registered: false,
    EBCitation: {
      contributors: [
        {
          last: "MARRINER",
          middle: null,
          first: "GERALD L.",
          function: "author",
        },
      ],
      pubjournal: {
        series: null,
        title: "Humboldt Journal of Social Relations",
        start: "127",
        issue: "2",
        volume: "1",
        year: null,
        end: "134",
      },
    },
    publisher_codes: ["humboldtsocio"],
    stable: "/stable/23261506",
    semantic_terms: [
      {
        fired: " women(19) females(17) human females(1)",
        term: "Women",
        n: 37,
      },
      {
        fired: " women(23)",
        term: "Womens rights",
        n: 23,
      },
      {
        fired: " mothers(19)",
        term: "Mothers",
        n: 19,
      },
      {
        fired: " marriage(19)",
        term: "Marriage",
        n: 19,
      },
      {
        fired: " women(14)",
        term: "Working women",
        n: 14,
      },
      {
        fired: " men(13)",
        term: "Men",
        n: 13,
      },
      {
        fired: " motherhood(11)",
        term: "Motherhood",
        n: 11,
      },
      {
        fired: " sex(8) prostitut*(3)",
        term: "Prostitution",
        n: 11,
      },
      {
        fired: " birth control(10) contraceptives(1)",
        term: "Birth control",
        n: 11,
      },
      {
        fired: " children(9)",
        term: "Children",
        n: 9,
      },
    ],
    ty: "research-article",
    ref_block: [
      "Flexner, 1959",
      "O'Neill, 1969a",
      "Smith, 1970",
      "Riegel, 1963.",
      "Reigel, 1970",
      "Sinclair, 1965",
      "Lasch, 1967:65-68",
      "Drinnon, 1961",
      "Millett. 1970:176-203",
      "Kennedy, 1970",
      "Goldman, 1910:243",
      "Eastman, 1920:23",
      "Hale, 1914:86",
      "Eastman, 1920:23",
      "Henrik Ibsen, A DOLL'S HOUSE, first published in 1879",
      "Anderson, Margaret C. 1930 MY THIRTY YEARS' WAR. New York: Covici, Friede.",
      "Drinnon, Richard. 1961 REBEL IN PARADISE: A BIOGRAPHY OF EMMA GOLDMAN. Chicago: University of Chicago Press.",
      'Eastman, Crystal. 1920 "Now we can begin." THE LIBERATOR III (December):23.',
      'Eaton, Jeannette. 1915 "The woman\'s magazine." THE MASSES VII (October-November):19.',
      "Flexner, Eleanor. 1959 CENTURY OF STRUGGLE: THE WOMAN'S RIGHTS MOVEMENT IN THE UNITED STATES. Cambridge: Belknap Press of Harvard University Press.",
      "Gilman, Charlotte Perkins. 1966 WOMEN AND ECONOMICS: A STUDY OF THE ECONOMIC RELATIONS BETWEEN MEN AND WOMEN AS A FACTOR IN SOCIAL EVOLUTION. Introduction by Carl Degler. Harper Torchbooks. New York: Harper & Row (Boston, 1898).",
      "Goldman, Emma. 1910 ANARCHISM AND OTHER ESSAYS. New York: Mother Earth Publishing Association.",
      "1970 LIVING MY LIFE. 2 vols. New York: Da Capo Press (New York, 1931).",
      "Hale, Beatrice Forbes-Robertson. 1914 WHAT WOMEN WANT: AN INTERPRETATION OF THE FEMINIST MOVEMENT. New York: Frederick A. Stokes Company.",
      "Kennedy, David M. 1970 BIRTH CONTROL IN AMERICA: THE CAREER OF MARGARET SANGER. New Haven: Yale University Press.",
      "Kraditor, Aileen S. 1965 THE IDEAS OF THE WOMAN SUFFRAGE MOVEMENT, 1890-1920. New York: Columbia University Press.",
      "Lasch, Christopher. 1967 THE NEW RADICALISM IN AMERICA, 1889-1963: THE INTELLECTUAL AS A SOCIAL TYPE. Vintage Books. New York: Random House (New York, 1965)",
      "Mayreder, Rosa. 1913 A SURVEY OF THE WOMAN PROBLEM. Translated by Herman Scheffauer. New York: George H. Doran Company.",
      "Millett, Kate. 1970 SEXUAL POLITICS. Garden City, New York: Doubleday.",
      "O'Neill, William L. 1969a EVERYONE WAS BRAVE: THE RISE AND FALL OF FEMINISM IN AMERICA.Chicago: Quadrangle Books.",
      "1969b THE WOMAN MOVEMENT: FEMINISM IN THE UNITED STATES AND ENGLAND. London: George Allen and Unwin Ltd.",
      'Patterson, Ethel Lloyd. 1911 "Lena Morrow Lewis: Agitator." THE MASSES I (July): 13.',
      "Riegel, Robert E. 1963 AMERICAN FEMINISTS. Lawrence: University of Kansas Press.",
      "1970 AMERICAN WOMEN: A STORY OF SOCIAL CHANGE. Rutherford, New Jersey: Fairleigh Dickinson University Press.",
      "Sanger, Margaret. 1938 MARGARET SANGER: AN AUTOBIOGRAPHY. New York: W. W. Norton & Company.",
      "Schreiner, Olive. 1911 WOMAN AND LABOR. New York: Frederick A. Stokes Company.",
      "Sinclair, Andrew. 1965 THE BETTER HALF: THE EMANCIPATION OF THE AMERICAN WOMAN. New York: Harper & Row.",
      "Smith, Page. 1970 DAUGHTERS OF THE PROMISED LAND: WOMEN IN AMERICAN HISTORY. Boston: Little, Brown and Company.",
    ],
    bidirectional_category: "left_to_right",
    identity_block: {
      issue_iid: ["a37ddab2-abda-340b-ab09-44a6906984a7"],
      issue_doi: ["10.2307/i23261497"],
      issn: ["01604341"],
      jcode: ["humjsocrel"],
      iid: ["0f2e71c7-1ce6-34d0-869b-fa2a879094f7"],
      oclc: ["646982769"],
      journal_doi: ["10.2307/j50004450"],
      journal_iid: ["adbd0d0e-7ff6-38d2-b36c-d6b5578ff4a5"],
      doi: ["10.2307/23261506"],
      eissn: [],
      lccn: [],
    },
    toc_context: {
      next: {
        iid: "d350339a-40da-3be2-85c5-c66c877b877c",
        doi: "10.2307/23261507",
      },
      up: {
        iid: "a37ddab2-abda-340b-ab09-44a6906984a7",
        doi: "10.2307/i23261497",
      },
      prev: {
        iid: "17a9af82-9355-3b2f-bdcc-252c9a02b1aa",
        doi: "10.2307/23261505",
      },
    },
    volume: "Vol. 1",
    page_ocrs: [
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/ocrs/57.xml__..JSTOR_OCR_JSON",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/ocrs/58.xml__..JSTOR_OCR_JSON",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/ocrs/59.xml__..JSTOR_OCR_JSON",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/ocrs/60.xml__..JSTOR_OCR_JSON",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/ocrs/61.xml__..JSTOR_OCR_JSON",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/ocrs/62.xml__..JSTOR_OCR_JSON",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/ocrs/63.xml__..JSTOR_OCR_JSON",
      "s3://sequoia-cedar/cedar_dev2/0f2e71c7/1ce6/34d0/869b/fa2a879094f7/i23261497/23261506/ocrs/64.xml__..JSTOR_OCR_JSON",
    ],
    pdf_size: 1437795,
    doi: "10.2307/23261506",
    end_date: "3000-01-01T00:00:00-0000",
    publisher_names: {
      humboldtsocio: "Department of Sociology, Humboldt State University",
    },
    publisher_logos: {
      humboldtsocio: null,
    },
    title_history: [
      {
        jcode: "humjsocrel",
        iid: "adbd0d0e-7ff6-38d2-b36c-d6b5578ff4a5",
        title: "Humboldt Journal of Social Relations",
        year_range: "1973-2017",
      },
    ],
    chunk_info_meta: "Produced on 2025-02-19 22:55",
    collections: {
      "asx-backfile-collection": "Arts_test092556",
    },
    publisher_codes_visible: ["humboldtsocio"],
    moving_wall: "0",
    "is-current-title": false,
    cover_image:
      "s3://sequoia-cedar/cedar_dev2/ac334b90/747d/36d2/a299/dc4ac45348a2/e90007861/issue-files/e90007861.xml__..ISSUE_COVER_IMAGE.jpg",
    start_date: "1000-01-01T00:00:00-0000",
    coverage: {
      period: "1973-2017 (Vol. 1, No. 1 - Vol. 39)",
      moving_wall_note:
        "Content for this title is released as soon as the latest issues become available to JSTOR.<br>Beginning with Vol. 34 (2012), this journal has been published online.",
    },
    copyright_statement: "{humboldtsocio}",
    journal_description:
      "<p>The <i>Humboldt Journal of Social Relations</i> (<i>HJSR</i>) is a peer reviewed free online journal housed in the Department of Sociology at Humboldt State University. This internationally recognized journal produces one annual themed spring edition focused around current issues and topics. While the articles primarily draw authors from the social sciences, we have also facilitated interdisciplinary collaborations among authors from the arts, humanities, natural sciences &amp; the social sciences. <br /></p>",
    primary_publisher: "humboldtsocio",
    journal_editable_1:
      '<p>\n<a href="http://www2.humboldt.edu/hjsr/policies.html">Submissions</a><br>\n<a href="http://www2.humboldt.edu/hjsr/">Journal Home Page</a><br>\n<a href="http://www2.humboldt.edu/hjsr/mostrecent.html">Subscribe</a><br>\n</p>',
    published_by_statement: "{humboldtsocio}",
    disciplines: {
      "sociology-discipline": "Sociology",
      "socialsciences-discipline": "Social Sciences",
    },
    sort_journal: "Humboldt Journal of Social Relations",
  },
];

export const metadata_response_forbidden = {
  status: 403,
};
export const metadata_response_allowed = {
  itemType: "article",
  contentType: "journal",
  isRightToLeft: false,
  pageCount: 8,
  status: 200,
};
const basic_item_response = {
  created_at: new Date("2023-10-01T00:00:00Z"),
  entities: {
    id: basic_reviewer.entities.id,
    name: basic_reviewer.entities.name,
  },
  groups: {
    id: basic_facility.entities.groups_entities[0].groups.id,
    name: basic_facility.entities.groups_entities[0].groups.name,
  },
};
export const denied_item_response = {
  jstor_item_id: cedar_identity_response.doi[0],
  jstor_item_type: jstor_types.doi,
  status: status_options.Denied,
  ...basic_item_response,
};
export const approved_item_response = {
  jstor_item_id: cedar_identity_response.doi[0],
  jstor_item_type: jstor_types.doi,
  status: status_options.Approved,
  ...basic_item_response,
};

export const approved_discipline_response = {
  jstor_item_id: cedar_item_view_response[0].disc_code[0],
  jstor_item_type: jstor_types.discipline,
  status: status_options.Approved,
  ...basic_item_response,
};

export const approved_journal_response = {
  jstor_item_id: cedar_identity_response.journal_iid[0],
  jstor_item_type: jstor_types.headid,
  status: status_options.Approved,
  ...basic_item_response,
};

export const ale_response = {
  results: [
    {
      item: "10.2307/20452663",
      iid: "06d158e4-d18e-3ba8-acd3-edea68f9f863",
      sessionEntitlements: [
        {
          entitlementId: "99999002705741",
          licenses: [
            {
              id: "d22bcedc-71af-4248-9d4f-b136c5b0ee96",
              type: "FREE",
              status: "OK",
              internalId: "562223",
              account: {
                id: "9e807dec-f37b-4c75-ac82-0c189a5cb0a0",
                internalId: "10003",
                legacyId: "2",
                createTime: 1136350800000,
                name: "All Unrestricted Users Group",
                description: "All users group",
                status: "ACTIVE",
                type: "GROUP",
                code: "All users group",
              },
              entitlement: {
                id: "99999002705741",
              },
              term: {
                inheritable: true,
                ignoreStart: true,
                ignoreEnd: true,
                gracePeriod: 0,
                concurrency: -1,
              },
              description: "All Users access to free content - non-chicali",
              preferences: {
                AccountSource: "ITHAKA",
              },
              createTime: 1445714584000,
              updateTime: 1445714584000,
              allowPrivateContent: false,
              priority: 990,
            },
          ],
          updateTime: 1445714584000,
        },
      ],
    },
  ],
  accessExperience: {
    "06d158e4-d18e-3ba8-acd3-edea68f9f863": "full_access",
  },
};

export const mock_image_response = {
  status: 200,
  data: "This would be an image",
};

export const cedar_item_view_without_page_images = cedar_item_view_response.map(
  (item) => ({
    ...item,
    page_images: [],
  }),
);
