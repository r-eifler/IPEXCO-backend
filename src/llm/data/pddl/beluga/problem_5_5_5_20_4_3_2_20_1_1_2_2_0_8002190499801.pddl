(define
	(problem beluga-problem_5_5_5_20_4_3_2_20_1_1_2_2_0_8002190499801)
	(:domain beluga)
  (:objects
		; Numbers: {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18}
		n00 - num
		n01 - num
		n02 - num
		n03 - num
		n04 - num
		n05 - num
		n06 - num
		n07 - num
		n08 - num
		n09 - num
		n10 - num
		n11 - num
		n12 - num
		n13 - num
		n14 - num
		n15 - num
		n16 - num
		n17 - num
		n18 - num
		; Trucks:
		beluga_trailer_1 - truck
		factory_trailer_1 - truck
		; Racks:
		rack00 - rack
		rack01 - rack
		rack02 - rack
		rack03 - rack
		rack04 - rack
		; Jigs:
		jig0001 - jig
		jig0002 - jig
		jig0003 - jig
		jig0004 - jig
		jig0005 - jig
		type0 - type
		type1 - type
		type2 - type
		type3 - type
		type4 - type
		; Hangers:
		hanger1 - hanger
		hanger2 - hanger
		; Beluga flights:
		beluga1 - beluga
		beluga2 - beluga
		beluga3 - beluga
		; Slots for outgoing flights:
		slot0 - slot
		; Production lines:
		pl0 - production-line
		pl1 - production-line
	)
  (:init
		; Number encoding
		; Sizes fitting rack: rack00
		(fit  n00  n01  n01 rack00)
		(fit  n01  n01  n02 rack00)
		(fit  n02  n01  n03 rack00)
		(fit  n00  n03  n03 rack00)
		(fit  n03  n01  n04 rack00)
		(fit  n01  n03  n04 rack00)
		(fit  n04  n01  n05 rack00)
		(fit  n02  n03  n05 rack00)
		(fit  n05  n01  n06 rack00)
		(fit  n03  n03  n06 rack00)
		(fit  n06  n01  n07 rack00)
		(fit  n04  n03  n07 rack00)
		(fit  n07  n01  n08 rack00)
		(fit  n05  n03  n08 rack00)
		(fit  n00  n08  n08 rack00)
		(fit  n08  n01  n09 rack00)
		(fit  n06  n03  n09 rack00)
		(fit  n01  n08  n09 rack00)
		(fit  n09  n01  n10 rack00)
		(fit  n07  n03  n10 rack00)
		(fit  n02  n08  n10 rack00)
		(fit  n10  n01  n11 rack00)
		(fit  n08  n03  n11 rack00)
		(fit  n03  n08  n11 rack00)
		(fit  n11  n01  n12 rack00)
		(fit  n09  n03  n12 rack00)
		(fit  n04  n08  n12 rack00)
		(fit  n00  n12  n12 rack00)
		(fit  n12  n01  n13 rack00)
		(fit  n10  n03  n13 rack00)
		(fit  n05  n08  n13 rack00)
		(fit  n01  n12  n13 rack00)
		(fit  n00  n13  n13 rack00)
		(fit  n13  n01  n14 rack00)
		(fit  n11  n03  n14 rack00)
		(fit  n06  n08  n14 rack00)
		(fit  n02  n12  n14 rack00)
		(fit  n01  n13  n14 rack00)
		(fit  n00  n14  n14 rack00)
		(fit  n14  n01  n15 rack00)
		(fit  n12  n03  n15 rack00)
		(fit  n07  n08  n15 rack00)
		(fit  n03  n12  n15 rack00)
		(fit  n02  n13  n15 rack00)
		(fit  n01  n14  n15 rack00)
		(fit  n15  n01  n16 rack00)
		(fit  n13  n03  n16 rack00)
		(fit  n08  n08  n16 rack00)
		(fit  n04  n12  n16 rack00)
		(fit  n03  n13  n16 rack00)
		(fit  n02  n14  n16 rack00)
		(fit  n00  n16  n16 rack00)
		(fit  n16  n01  n17 rack00)
		(fit  n14  n03  n17 rack00)
		(fit  n09  n08  n17 rack00)
		(fit  n05  n12  n17 rack00)
		(fit  n04  n13  n17 rack00)
		(fit  n03  n14  n17 rack00)
		(fit  n01  n16  n17 rack00)
		(fit  n00  n17  n17 rack00)
		; Sizes fitting rack: rack01
		(fit  n00  n01  n01 rack01)
		(fit  n01  n01  n02 rack01)
		(fit  n02  n01  n03 rack01)
		(fit  n00  n03  n03 rack01)
		(fit  n03  n01  n04 rack01)
		(fit  n01  n03  n04 rack01)
		(fit  n04  n01  n05 rack01)
		(fit  n02  n03  n05 rack01)
		; Sizes fitting rack: rack02
		(fit  n00  n01  n01 rack02)
		(fit  n01  n01  n02 rack02)
		(fit  n02  n01  n03 rack02)
		(fit  n00  n03  n03 rack02)
		(fit  n03  n01  n04 rack02)
		(fit  n01  n03  n04 rack02)
		(fit  n04  n01  n05 rack02)
		(fit  n02  n03  n05 rack02)
		(fit  n05  n01  n06 rack02)
		(fit  n03  n03  n06 rack02)
		(fit  n06  n01  n07 rack02)
		(fit  n04  n03  n07 rack02)
		(fit  n07  n01  n08 rack02)
		(fit  n05  n03  n08 rack02)
		(fit  n00  n08  n08 rack02)
		(fit  n08  n01  n09 rack02)
		(fit  n06  n03  n09 rack02)
		(fit  n01  n08  n09 rack02)
		(fit  n09  n01  n10 rack02)
		(fit  n07  n03  n10 rack02)
		(fit  n02  n08  n10 rack02)
		(fit  n10  n01  n11 rack02)
		(fit  n08  n03  n11 rack02)
		(fit  n03  n08  n11 rack02)
		(fit  n11  n01  n12 rack02)
		(fit  n09  n03  n12 rack02)
		(fit  n04  n08  n12 rack02)
		(fit  n00  n12  n12 rack02)
		(fit  n12  n01  n13 rack02)
		(fit  n10  n03  n13 rack02)
		(fit  n05  n08  n13 rack02)
		(fit  n01  n12  n13 rack02)
		(fit  n00  n13  n13 rack02)
		(fit  n13  n01  n14 rack02)
		(fit  n11  n03  n14 rack02)
		(fit  n06  n08  n14 rack02)
		(fit  n02  n12  n14 rack02)
		(fit  n01  n13  n14 rack02)
		(fit  n00  n14  n14 rack02)
		(fit  n14  n01  n15 rack02)
		(fit  n12  n03  n15 rack02)
		(fit  n07  n08  n15 rack02)
		(fit  n03  n12  n15 rack02)
		(fit  n02  n13  n15 rack02)
		(fit  n01  n14  n15 rack02)
		(fit  n15  n01  n16 rack02)
		(fit  n13  n03  n16 rack02)
		(fit  n08  n08  n16 rack02)
		(fit  n04  n12  n16 rack02)
		(fit  n03  n13  n16 rack02)
		(fit  n02  n14  n16 rack02)
		(fit  n00  n16  n16 rack02)
		(fit  n16  n01  n17 rack02)
		(fit  n14  n03  n17 rack02)
		(fit  n09  n08  n17 rack02)
		(fit  n05  n12  n17 rack02)
		(fit  n04  n13  n17 rack02)
		(fit  n03  n14  n17 rack02)
		(fit  n01  n16  n17 rack02)
		(fit  n00  n17  n17 rack02)
		(fit  n17  n01  n18 rack02)
		(fit  n15  n03  n18 rack02)
		(fit  n10  n08  n18 rack02)
		(fit  n06  n12  n18 rack02)
		(fit  n05  n13  n18 rack02)
		(fit  n04  n14  n18 rack02)
		(fit  n02  n16  n18 rack02)
		(fit  n01  n17  n18 rack02)
		; Sizes fitting rack: rack03
		(fit  n00  n01  n01 rack03)
		(fit  n01  n01  n02 rack03)
		(fit  n02  n01  n03 rack03)
		(fit  n00  n03  n03 rack03)
		(fit  n03  n01  n04 rack03)
		(fit  n01  n03  n04 rack03)
		(fit  n04  n01  n05 rack03)
		(fit  n02  n03  n05 rack03)
		(fit  n05  n01  n06 rack03)
		(fit  n03  n03  n06 rack03)
		; Sizes fitting rack: rack04
		(fit  n00  n01  n01 rack04)
		(fit  n01  n01  n02 rack04)
		(fit  n02  n01  n03 rack04)
		(fit  n00  n03  n03 rack04)
		(fit  n03  n01  n04 rack04)
		(fit  n01  n03  n04 rack04)
		(fit  n04  n01  n05 rack04)
		(fit  n02  n03  n05 rack04)
		(fit  n05  n01  n06 rack04)
		(fit  n03  n03  n06 rack04)
		(fit  n06  n01  n07 rack04)
		(fit  n04  n03  n07 rack04)
		(fit  n07  n01  n08 rack04)
		(fit  n05  n03  n08 rack04)
		(fit  n00  n08  n08 rack04)
		(fit  n08  n01  n09 rack04)
		(fit  n06  n03  n09 rack04)
		(fit  n01  n08  n09 rack04)
		(fit  n09  n01  n10 rack04)
		(fit  n07  n03  n10 rack04)
		(fit  n02  n08  n10 rack04)
		(fit  n10  n01  n11 rack04)
		(fit  n08  n03  n11 rack04)
		(fit  n03  n08  n11 rack04)
		(fit  n11  n01  n12 rack04)
		(fit  n09  n03  n12 rack04)
		(fit  n04  n08  n12 rack04)
		(fit  n00  n12  n12 rack04)
		(fit  n12  n01  n13 rack04)
		(fit  n10  n03  n13 rack04)
		(fit  n05  n08  n13 rack04)
		(fit  n01  n12  n13 rack04)
		(fit  n00  n13  n13 rack04)
		(fit  n13  n01  n14 rack04)
		(fit  n11  n03  n14 rack04)
		(fit  n06  n08  n14 rack04)
		(fit  n02  n12  n14 rack04)
		(fit  n01  n13  n14 rack04)
		(fit  n00  n14  n14 rack04)
		(fit  n14  n01  n15 rack04)
		(fit  n12  n03  n15 rack04)
		(fit  n07  n08  n15 rack04)
		(fit  n03  n12  n15 rack04)
		(fit  n02  n13  n15 rack04)
		(fit  n01  n14  n15 rack04)
		(fit  n15  n01  n16 rack04)
		(fit  n13  n03  n16 rack04)
		(fit  n08  n08  n16 rack04)
		(fit  n04  n12  n16 rack04)
		(fit  n03  n13  n16 rack04)
		(fit  n02  n14  n16 rack04)
		(fit  n00  n16  n16 rack04)
		; Trucks (Beluga side):
		(empty beluga_trailer_1)
		(at-side beluga_trailer_1 bside)
		; Trucks (Factory side):
		(empty factory_trailer_1)
		(at-side factory_trailer_1 fside)
		; Racks 5
		; Rack:rack00
		(at-side rack00 bside)
		(at-side rack00 fside)
		(free-space rack00 n01)
		(in jig0002 rack00)
		(clear jig0002 bside)
		(clear jig0002 fside)
		; Rack:rack01
		(empty rack01)
		(at-side rack01 bside)
		(at-side rack01 fside)
		(free-space rack01 n05)
		; Rack:rack02
		(at-side rack02 bside)
		(at-side rack02 fside)
		(free-space rack02 n15)
		(in jig0001 rack02)
		(clear jig0001 bside)
		(clear jig0001 fside)
		; Rack:rack03
		(empty rack03)
		(at-side rack03 bside)
		(at-side rack03 fside)
		(free-space rack03 n06)
		; Rack:rack04
		(at-side rack04 bside)
		(at-side rack04 fside)
		(free-space rack04 n02)
		(in jig0003 rack04)
		(clear jig0003 bside)
		(clear jig0003 fside)
		; Jigs (size):
		(is_type jig0001 type1)
		(size jig0001 n03)
		(empty-size jig0001 n01)
		(is_type jig0002 type2)
		(size jig0002 n16)
		(empty-size jig0002 n16)
		(empty jig0002)
		(is_type jig0003 type0)
		(size jig0003 n14)
		(empty-size jig0003 n08)
		(is_type jig0004 type4)
		(size jig0004 n13)
		(empty-size jig0004 n12)
		(is_type jig0005 type3)
		(size jig0005 n14)
		(empty-size jig0005 n12)
		; Hangers:
		(empty hanger1)
		(empty hanger2)
		; Flight schedule initial phase:
		(in-phase beluga1)
		; Flight order:
		(next-phase beluga1 beluga2)
		(next-phase beluga2 beluga3)
		; Number of flights: 3
		; Incoming jigs unload order:
		; Flight: beluga1
		; 0: jig0004
		(to_unload jig0004 beluga1)
		(in jig0004 beluga1)
		(next_unload jig0004 dummy-jig)
		; Flight: beluga2
		; 0: jig0005
		(to_unload jig0005 beluga2)
		(in jig0005 beluga2)
		(next_unload jig0005 dummy-jig)
		; Flight: beluga3
		; 
		(to_unload dummy-jig beluga3)
		; Outgoing jigs load order:
		; 0: type2
		(to_load type2 slot0 beluga1)
		(next_load dummy-type slot0 dummy-slot beluga1)
		; 
		(to_load dummy-type dummy-slot beluga2)
		; 0: type1
		(to_load type1 slot0 beluga3)
		(next_load dummy-type slot0 dummy-slot beluga3)
		; Production schedule:
		; Production line: pl0
		; 0: jig0001 1: jig0004
		(to_deliver jig0001 pl0)
		(next_deliver jig0001 jig0004)
		(next_deliver jig0004 dummy-jig)
		; Production line: pl1
		; 0: jig0003
		(to_deliver jig0003 pl1)
		(next_deliver jig0003 dummy-jig)
		; Action cost:
		(= (total-cost ) 0)
	)
  (:goal (and
		; All jigs empty (order defined by production schedule)
		(empty jig0001)
		(empty jig0004)
		(empty jig0003)
		; all Beluga fully unloaded:
		(to_unload dummy-jig beluga1)
		(to_unload dummy-jig beluga2)
		(to_unload dummy-jig beluga3)
		; all Beluga fully loaded:
		(to_load dummy-type dummy-slot beluga1)
		(to_load dummy-type dummy-slot beluga2)
		(to_load dummy-type dummy-slot beluga3)
	))
  (:metric minimize (total-cost))
)