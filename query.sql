--SELECT * from public."Document";

--INSERT INTO "Document" VALUES ('case1',1,'{ "text":"test","number":1, "ref":{"id":"customer1"} } '); 
--INSERT INTO "Document" VALUES ('customer1', 1,'{ "name":"customer1","age":20 } ') ;

--CREATE INDEX customer_age ON "Document" ((data->'age'));

--set enable_seqscan=false;

/*

SELECT * FROM "Document"
WHERE data->'age' IN ('10','20');

--CREATE INDEX ON "Document" USING GIN (data);
*/
/*select * from "Document" as doc,
 LATERAL jsonb_to_record(doc.data) AS data(age integer)
 WHERE doc.data ? 'age' AND data.age > 10;
 */
 
/*

SELECT * FROM "Case_2";


SELECT * FROM "Case_2" WHERE  ("data.customers")[1].id = 'customer1';


SELECT * FROM ( SELECT *, generate_subscripts("data.customers",1) as s FROM "Case_2") as main WHERE  ("data.customers")[s].id = 'customer2';

*/
WITH TEST_CASE_all as (
SELECT * from TEST_CASE_1
),
data_ref AS (
SELECT id, number, 'p1' FROM TEST_PRODUCT_1
WHERE TEST_PRODUCT_1.number < 10000
UNION ALL
SELECT id, number, 'p2' FROM TEST_PRODUCT_2
WHERE TEST_PRODUCT_2.number < 10000
)
SELECT TEST_CASE_all.id, TEST_CASE_all.name, data_ref.number from TEST_CASE_all
INNER JOIN data_ref ON (data_ref.id = TEST_CASE_all.data_ref)
WHERE TEST_CASE_all.number > 1000;

-- with company too

WITH TEST_CASE_all as (
SELECT * from TEST_CASE_1
WHERE TEST_CASE_1.number > 1000
),
data_ref AS (
WITH TEST_COMPANY_all AS (
SELECT id, TEST_COMPANY_1.number as coNumber FROM TEST_COMPANY_1
WHERE TEST_COMPANY_1.number > 10000
)
SELECT TEST_PRODUCT_1.id, number, 'p1',TEST_COMPANY_all.coNumber FROM TEST_PRODUCT_1
INNER JOIN TEST_COMPANY_all ON (TEST_PRODUCT_1.data_ref = TEST_COMPANY_all.id)
WHERE TEST_PRODUCT_1.number < 10000 
UNION ALL
SELECT TEST_PRODUCT_2.id, number, 'p2', TEST_COMPANY_all.coNumber FROM TEST_PRODUCT_2
INNER JOIN TEST_COMPANY_all ON (TEST_PRODUCT_2.data_ref = TEST_COMPANY_all.id)
WHERE TEST_PRODUCT_2.number < 10000
)
SELECT TEST_CASE_all.id, TEST_CASE_all.name, data_ref.number, coNumber from TEST_CASE_all
INNER JOIN data_ref ON (TEST_CASE_all.data_ref = data_ref.id)


